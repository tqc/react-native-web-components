import React, { Component } from 'react';

import { WebView } from 'react-native';

import { connect } from "react-redux";

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

        var cssUrl = "http://localhost:8081/component.css";
        var bundleUrl = "http://localhost:8081/componenttest.bundle?platform=ios&dev=true&minify=false";

        var source = {
            html: "<html><head><link rel='stylesheet' href='" + cssUrl + "'></head><body>Hello world5</body><script>window.process = {env: {}};window.isWrappedComponent = true; window.initialState=" + initialState + ";</script><script src='" + bundleUrl + "'></script></html> "
        };


        return (

            <WebView ref = { webview => { this.webview = webview; } }
            source = { source }
            onMessage = {(e) => this.processMessage(e)}
            style = {
                { flex: 1, backgroundColor: "white" } }
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
        console.log(this.props.component);
        if (!this.mappedProps) {
            var state = this.store.getState();
            this.mappedProps = this.props.component.mapStateToProps(state, {});
        }

        this.ConnectedComponent = this.ConnectedComponent || connect(this.props.component.mapStateToProps, this.props.component.mapDispatchToProps)(MappedComponent);
        var ConnectedComponent = this.ConnectedComponent;

        return (<ConnectedComponent propKeys = { Object.keys(this.mappedProps) }
            />
        );
    }
}

WebWrapper.contextTypes = {
    store: React.PropTypes.any
};

export { WebWrapper };
