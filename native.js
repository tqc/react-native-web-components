import React, { Component } from 'react';

import { View, WebView } from 'react-native';

import { connect } from "react-redux";

var WW;

class MappedComponent extends Component {
    constructor(props, context) {
        super(props, context);
        this.sentState = {};
        this.store = props.store || context.store;
            // call store.getState so we can call mapStateToProps on it
    }
    processMessage(e) {
        console.log("received message from webview");
        var message = e.nativeEvent.data;
        if (!message) return;
        else if (message.indexOf("{") == 0) {
            // action
            this.store.dispatch(JSON.parse(message));
        }
        else {
            console.log(message);
        }
    }
    shouldComponentUpdate(nextProps, nextState) {

        var payload = {};
        for (let i = 0; i < nextProps.propKeys.length; i++) {
            let k = nextProps.propKeys[i];
            // todo: no need to send unchanged values
            if (this.sentState[k] == nextProps[k]) continue;
            payload[k] = this.sentState[k] = nextProps[k];
        }

        console.log("Update of webview");
        this.webview.postMessage(JSON.stringify(payload));

        return false;

    }
    render() {
        //alert(this.props.component && this.props.component.url);
        //alert(this.props.testval);

        var payload = {};
        for (let i = 0; i < this.props.propKeys.length; i++) {
            let k = this.props.propKeys[i];
            payload[k] = this.sentState[k] = this.props[k];
        }

        var initialState = JSON.stringify(payload);

        console.log("First load of webview");

        let componentKey = this.props.componentKey || this.props.name;
        if (!componentKey) {
            console.error("componentKey not set");
            return (
                <View style={{flex: 1}}>
                    <Text>componentKey not set</Text>
                </View>
            );
        }


        var mainBundleUrl = WW.mainBundleUrl || "http://localhost:8081/index.ios.js.bundle?platform=ios&dev=true&minify=false";

        var isDevUrl = mainBundleUrl.indexOf("http") >= 0;

        var baseUrl = WW.baseUrl || mainBundleUrl.substr(0, isDevUrl ? mainBundleUrl.indexOf("index.") : mainBundleUrl.indexOf("main.jsbundle"));

        console.log(baseUrl);

        var cssUrl = baseUrl + "build/index.css";
        var bundleUrl = isDevUrl ? mainBundleUrl.replace(/(index.ios)/, "rnwc/" + componentKey) : baseUrl + "rnwc/" + componentKey + ".jsbundle";

        var source = {
            baseUrl,
            html: "<html><head><link rel='stylesheet' href='" + cssUrl + "'></head><body></body><script>window.process = {env: {}};window.isWrappedComponent = true; window.initialState=" + initialState + ";</script><script src='" + bundleUrl + "'></script></html> "
        };

        var style = {};
        style.flex = 1;
        style.backgroundColor = this.props.backgroundColor || "transparent";

        return (

            <WebView ref = { webview => { this.webview = webview; } }
            source = { source }
            onMessage = {(e) => this.processMessage(e)}
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
        console.log(this.props.style);
        console.log("Rendering WebWrapper");
        console.log(this.props.component);
        if (!this.mappedProps) {
            var state = this.store.getState();
            this.mappedProps = this.props.component.mapStateToProps(state, {});
        }

        this.ConnectedComponent = this.ConnectedComponent || connect(this.props.component.mapStateToProps, this.props.component.mapDispatchToProps)(MappedComponent);
        var ConnectedComponent = this.ConnectedComponent;

        return (<ConnectedComponent {...this.props} propKeys = { Object.keys(this.mappedProps) }
            />
        );
    }
}
WW = WebWrapper;
WebWrapper.contextTypes = {
    store: React.PropTypes.any
};

export { WebWrapper };
