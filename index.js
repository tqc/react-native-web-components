import {Component, createElement} from "react";

import { connect as rrc } from 'react-redux';

export function connect(a, b, c) {
    if (global.__fbBatchedBridgeConfig) {
        // native host - render a web view and connect it with redux
        // just return settings
        // call with <WebWrapper component={TestComponent} />
        // or WrapWebComponent(TestComponent)
        return function(component) {
            return {
                url: "componenttest.js",
                mapStateToProps: a,
                mapDispatchToProps: b
            };
        };
    } else if (global.isWrappedComponent) {

        // inside the wrapped webview - return the unconnected component and wait for a message
        // implementation will be similar to react-redux - update props on message
        //alert(global.initialState);
        return function(InnerComponent) {

            class ConnectedComponent extends Component {
                render() {
                    var initialProps = window.initialState;

                    return createElement(InnerComponent, {
                        ...initialProps,
                        ref: 'wrappedInstance'
                    });
                }
            }

            return ConnectedComponent;
        };
    } else {
        // web component in normal use - call react redux
        return rrc(a, b, c);
    }
}
