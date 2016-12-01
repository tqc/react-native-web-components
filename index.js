import {Component, createElement} from "react";

import { connect as rrc } from 'react-redux';

export function connect(mapStateToProps, mapDispatchToProps, c) {
    if (global.__fbBatchedBridgeConfig) {
        // native host - render a web view and connect it with redux
        // just return settings
        // call with <WebWrapper component={TestComponent} />
        // or WrapWebComponent(TestComponent)
        return function(component) {
            return {
                url: "componenttest.js",
                mapStateToProps: mapStateToProps,
                mapDispatchToProps: mapDispatchToProps
            };
        };
    } else if (global.isWrappedComponent) {

        // inside the wrapped webview - return the unconnected component and wait for a message
        // implementation will be similar to react-redux - update props on message
        //alert(global.initialState);


        let mappedFunctions = {};

        if (mapDispatchToProps) {
            mappedFunctions = mapDispatchToProps((action) => window.postMessage(JSON.stringify(action)));
        }

        return function(InnerComponent) {

            class ConnectedComponent extends Component {
                constructor() {
                    super();
                    this.receivedState = window.initialState;
                    let component = this;
                    document.addEventListener("message", function(e) {
                        console.log("message received");
                        console.log(e);
                        component.receivedState.message = JSON.stringify(e.data);
                        component.receivedState = Object.assign(component.receivedState, JSON.parse(e.data));
                        component.setState({
                            message3: JSON.stringify(e.data)
                        });
                    });

                }
                render() {
                    var initialProps = window.initialState;

                    return createElement(InnerComponent, {
                        ...this.receivedState,
                        ...mappedFunctions,
                        message3: this.props.message3,
                        ref: 'wrappedInstance'
                    });
                }
            }

            return ConnectedComponent;
        };
    } else {
        // web component in normal use - call react redux
        return rrc(mapStateToProps, mapDispatchToProps, c);
    }
}
