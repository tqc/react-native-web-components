import React, { Component } from 'react';
import PropTypes from "prop-types";

import { View, WebView } from 'react-native';

import { connect } from "react-redux";

import {WebWrapper} from "./index";

let config = {
    useCombinedScript: true,
    mainBundleUrl: "http://localhost:8081/index.ios.bundle?platform=ios&dev=true&minify=false"
    // baseUrl,
    // cssUrl
};

export class MappedComponent extends Component {
    static contextTypes = {
        store: PropTypes.any
    };
    static propTypes = {
        store: PropTypes.any,
        componentKey: PropTypes.string,
        // fallback if componentKey is not specified
        name: PropTypes.string,
        // if true, web view loads rnwc/allcomponents.js
        // if false, web view loads rnwc/[componentKey].js
        useCombinedScript: PropTypes.bool,
        // color that will appear on overscroll
        backgroundColor: PropTypes.string,
        // if true, the webview will be the height of the html content
        // if false, it will use flex:1 to fill the containing view, possibly with scrolling
        resizeToContent: PropTypes.bool
    }
    constructor(props, context) {
        super(props, context);
        this.sentState = {
            functionKeys: []
        };
        this.state = {
            contentHeight: 0
        };
    }
    processMessage(e) {
        let store = this.props.store || this.context.store;
        console.log("received message from webview");
        this.webview.postMessage(JSON.stringify({type: "ACK"}));
        var message = e.nativeEvent.data;
        if (!message) return;
        else if (message.indexOf("{") == 0) {
            let action = JSON.parse(message);
            if (action.type == "RNWC_PROPERTY_FUNCTION") {
                this.props[action.func].apply(null, action.params);
            }
            else if (action.type == "RNWC_CONTENT_SIZE") {
                console.log("Got height " + action.height);
                this.setState({
                    contentHeight: action.height
                });
            }
            else {
                // action
                store.dispatch(action);
            }
        }
        else {
            console.log(message);
        }
    }
    getPayload(oldProps, nextProps) {
        var payload = {};

        var newFunctionKeys = [];
        for (let k in nextProps) {
            if (k == "component") continue;
            if (typeof nextProps[k] == "function") {
                if (this.sentState.functionKeys.indexOf(k) < 0) {
                    newFunctionKeys.push(k);
                }
                continue;
            }
            if (this.sentState[k] == nextProps[k]) continue;
            let jns = JSON.stringify(nextProps[k]);
            if (JSON.stringify(this.sentState[k]) == jns) continue;
            payload[k] = this.sentState[k] = nextProps[k];

            // if a property changes to undefined, replace it with null since
            // undefined is used to mean not updated
            if (payload[k] === undefined) payload[k] = null;
        }

        if (newFunctionKeys.length > 0) {
            payload.functionKeys = this.sentState.functionKeys = this.sentState.functionKeys.concat(newFunctionKeys);
        }

        return payload;
    }
    shouldComponentUpdate(nextProps, nextState) {
        let payload = this.getPayload(this.props, nextProps);
        if (Object.keys(payload).length > 0) {
            console.log("Update of webview " + nextProps.componentKey);
            //console.log(payload);
            this.webview.postMessage(JSON.stringify(payload));
        }
        if (nextState.contentHeight != this.state.contentHeight) {
            console.log("contentHeight changed from " + this.state.contentHeight + " to " + nextState.contentHeight);
            return true;
        }
        return false;
    }
    getWebViewSettings() {
        if (this.webViewSettings) return this.webViewSettings;


        var payload = this.getPayload({}, this.props);

        var initialState = JSON.stringify(payload).replace(/<\/(script)/gi, "<\\/$1");



        let componentKey = this.props.componentKey || this.props.name;

        var mainBundleUrl = config.mainBundleUrl;

        let m = (/(.*\/)([^/]*)(\.(js)?bundle.*)/g).exec(mainBundleUrl);

        var baseUrl = config.baseUrl || m[1];
        var cssUrl = config.cssUrl || (baseUrl + "build/index.css");

        let useCombinedScript = this.props.useCombinedScript === undefined ? config.useCombinedScript : this.props.useCombinedScript;

        var entryPointName = useCombinedScript ? "allcomponents" : componentKey;
        var bundleUrl = baseUrl + "rnwc/" + entryPointName + m[3];

        var source = {
            baseUrl,
            html: "\
                <html>\
                    <head>\
                        <link rel='stylesheet' href='" + cssUrl + "'>\
                        <script>\
                            window.process = {env: {}};\
                            window.isWrappedComponent = true;\
                            window.initialState=" + initialState + ";\
                            window.componentKey='" + componentKey + "';\
                        </script>\
                    </head>\
                    <body></body>\
                        <script src='" + bundleUrl + "'></script>\
                </html>"
        };

        this.webViewSettings = {
            source,
            onMessage: (e) => this.processMessage(e)
        };


        return this.webViewSettings;

    }
    renderHeader() {
        return null;
    }
    render() {
        console.log("rendering webview");
        let webViewSettings = this.getWebViewSettings();

        let componentKey = this.props.componentKey || this.props.name;
        if (!componentKey) {
            console.error("componentKey not set");
            return (
                <View style={{flex: 1}}>
                    <Text>Component key not set</Text>
                </View>
            );
        }

        var style = {};
        style.backgroundColor = this.props.backgroundColor || "transparent";
        if (this.props.resizeToContent == true) {
            style.height = Math.max(this.state.contentHeight, this.props.minHeight || 0);
        }
        else {
            style.flex = 1;
        }

        return (
            <View style = {style}>
            {this.renderHeader()}
            <WebView ref = { webview => { this.webview = webview; } }
            source = { webViewSettings.source }
            onMessage = {webViewSettings.onMessage}
            style = {style}
            scrollEnabled={!this.props.resizeToContent}
            scalesPageToFit={false}
            />
            </View>
        );
    }
}


WebWrapper.prototype.render = function renderWebWrapper() {
    console.log("Rendering WebWrapper");
    console.log(this.props.component.name);
    let customProps = {...this.props};
    delete customProps.component;

    let shouldConnect = this.props.component.mapStateToProps || this.props.component.mapDispatchToProps;
    if (shouldConnect) {
        var ConnectedComponent = this.ConnectedComponent = this.ConnectedComponent || connect(this.props.component.mapStateToProps, this.props.component.mapDispatchToProps)(MappedComponent);
        return (<ConnectedComponent {...customProps}/>);
    } else {
        return (<MappedComponent {...customProps}/>);
    }

};

export function configureWebComponents(cfg) {
    Object.assign(config, cfg || {});
}

export { WebWrapper };
