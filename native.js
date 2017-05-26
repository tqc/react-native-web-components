import React, { Component } from 'react';

import { View, WebView } from 'react-native';

import { connect } from "react-redux";

var WW;

class MappedComponent extends Component {
    constructor(props, context) {
        super(props, context);
        this.sentState = {};
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

        var functionKeys = [];
        for (let k in nextProps) {
            if (k == "component") continue;
            if (this.props[k] == nextProps[k]) continue;
            if (typeof nextProps[k] == "function") {
                functionKeys.push(k);
                continue;
            }
            if (this.sentState[k] == nextProps[k]) continue;
            payload[k] = this.sentState[k] = nextProps[k];

            // if a property changes to undefined, replace it with null since
            // undefined is used to mean not updated
            if (payload[k] === undefined) payload[k] = null;
        }

        if (!this.sentState.functionKeys || functionKeys.length > 0) {
            payload.functionKeys = this.sentState.functionKeys = functionKeys;
        }

        return payload;
    }
    shouldComponentUpdate(nextProps, nextState) {
        let payload = this.getPayload(this.props, nextProps);
        if (Object.keys(payload).length > 0) {
            console.log("Update of webview " + nextProps.componentKey);
            this.webview.postMessage(JSON.stringify(payload));
        }
        if (nextState.contentHeight != this.state.contentHeight) return true;
        return false;
    }
    getWebViewSettings() {
        if (this.webViewSettings) return this.webViewSettings;


        var payload = this.getPayload({}, this.props);

        var initialState = JSON.stringify(payload);


        let componentKey = this.props.componentKey || this.props.name;

        var mainBundleUrl = WW.mainBundleUrl || "http://localhost:8081/index.ios.js.bundle?platform=ios&dev=true&minify=false";

        var isDevUrl = mainBundleUrl.indexOf("http") >= 0;

        var baseUrl = WW.baseUrl || mainBundleUrl.substr(0, isDevUrl ? mainBundleUrl.indexOf("index.") : mainBundleUrl.indexOf("main.jsbundle"));

        var cssUrl = baseUrl + "build/index.css";
        var entryPointName = this.props.useCombinedScript ? "allcomponents" : componentKey;
        var bundleUrl = isDevUrl ? mainBundleUrl.replace(/(index.ios)/, "rnwc/" + entryPointName) : baseUrl + "rnwc/" + entryPointName + ".jsbundle";

        var source = {
            baseUrl,
            html: "\
                <html>\
                    <head>\
                        <link rel='stylesheet' href='" + cssUrl + "'>\
                    </head>\
                    <body></body>\
                    <script>\
                        window.process = {env: {}};\
                        window.isWrappedComponent = true;\
                        window.initialState=" + initialState + ";\
                        window.componentKey='" + componentKey + "';\
                        </script>\
                        <script src='" + bundleUrl + "'></script>\
                </html>"
        };

        this.webViewSettings = {
            source,
            onMessage: (e) => this.processMessage(e)
        };


        return this.webViewSettings;

    }
    render() {
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
            style.height = this.state.contentHeight;
        }
        else {
            style.flex = 1;
        }

        return (
            <WebView ref = { webview => { this.webview = webview; } }
            source = { webViewSettings.source }
            onMessage = {webViewSettings.onMessage}
            style = {style}
            />

        );
    }
}

MappedComponent.contextTypes = {
    store: React.PropTypes.any
};



class WebWrapper extends Component {
    constructor(props, context) {
        super(props, context);
        this.store = props.store || context.store;
            // call store.getState so we can call mapStateToProps on it
    }
    render() {
        console.log("Rendering WebWrapper");

        let customProps = {...this.props};
        delete customProps.component;

        let shouldConnect = this.props.component.mapStateToProps || this.props.component.mapDispatchToProps;
        if (shouldConnect) {
            var ConnectedComponent = this.ConnectedComponent = this.ConnectedComponent || connect(this.props.component.mapStateToProps, this.props.component.mapDispatchToProps)(MappedComponent);
            return (<ConnectedComponent {...customProps}/>);
        } else {
            return (<MappedComponent {...customProps}/>);
        }

    }
}
WW = WebWrapper;
WebWrapper.contextTypes = {
    store: React.PropTypes.any
};

export { WebWrapper };
