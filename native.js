import React, { Component } from 'react';

import { WebView } from 'react-native';

import { connect } from "react-redux";

class MappedComponent extends Component {
    render() {
        //alert(this.props.component && this.props.component.url);
        //alert(this.props.testval);

        var initialState = "{}";


        var payload = {};
        for (let i = 0; i < this.props.propKeys.length; i++) {
            let k = this.props.propKeys[i];
            payload[k] = this.props[k];
        }


        if (!this.webview) {
            // first load only
            initialState = JSON.stringify(payload);
        } else {
            this.webview.postMessage(JSON.stringify(payload));
        }

        var source = {
            html: "<body>Hello world5</body><script>window.process = {env: {}};window.isWrappedComponent = true; window.initialState=" + initialState + ";</script><script src='http://localhost:8081/componenttest.bundle?platform=ios&dev=true&minify=false'></script> "
        };

        return (

            <WebView ref = { webview => { this.webview = webview; } }
            source = { source }
            style = {
                { height: 250, width: 250 } }
            />

        );
    }
}



class WebWrapper extends Component {
    constructor(props, context) {
        super(props, context);
        this.store = props.store || context.store;
            // call store.getState so we can call mapStateToProps on it
    }
    render() {

        if (!this.mappedProps) {
            var state = this.store.getState();
            this.mappedProps = this.props.component.mapStateToProps(state, {});
        }

        this.ConnectedComponent = this.ConnectedComponent || connect(this.props.component.mapStateToProps, this.props.component.mapDispatchToProps)(MappedComponent);
        var ConnectedComponent = this.ConnectedComponent;

        return ( <ConnectedComponent propKeys = { Object.keys(this.mappedProps) }
            />
        );
    }
}

WebWrapper.contextTypes = {
    store: React.PropTypes.any
};

export { WebWrapper };
