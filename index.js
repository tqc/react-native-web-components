import {Component, createElement} from "react";

import { connect as rrc } from 'react-redux';


var messageQueue = [];

var messagePending = false;
function processQueue() {
    if (!messageQueue.length || messagePending) return;
    messagePending = true;
    window.location = 'react-js-navigation://postMessage?' + encodeURIComponent(messageQueue.shift());
}

function postMessage(message) {
    messageQueue.push(JSON.stringify(message));
    processQueue();
}

export function connect(mapStateToProps, mapDispatchToProps, mergeProps, options) {
    console.log("Connect....");
    let isNativeApp = (typeof navigator !== 'undefined' && navigator.product === 'ReactNative');
    if (isNativeApp) {
        console.log("detected native component");
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
        console.log("detected wrapped component");
        // inside the wrapped webview - return the unconnected component and wait for a message
        // implementation will be similar to react-redux - update props on message
        //alert(global.initialState);


        let mappedFunctions = {};

        if (mapDispatchToProps) {
            // this may run before react native injects window.postMessage
            mappedFunctions = mapDispatchToProps(postMessage);
        }


        return function(InnerComponent) {

            class ConnectedComponent extends Component {
                constructor() {
                    super();
                    let component = this;
                    component.state = window.initialState;

                    if (component.state.functionKeys) {
                        for (let k of component.state.functionKeys) {
                            mappedFunctions[k] = (a, b, c, d, e, f, g) => postMessage({type: "RNWC_PROPERTY_FUNCTION", func: k, params: [a, b, c, d, e, f, g]});
                        }
                    }


                    document.addEventListener("message", function(event) {
                        console.log("message received - new");
                        console.log(event);
                        var message = JSON.parse(event.data);
                        if (message.type == "ACK") {
                            messagePending = false;
                            processQueue();
                        }
                        else {
                            if (message.functionKeys) {
                                for (let k of message.functionKeys) {
                                    mappedFunctions[k] = (a, b, c, d, e, f, g) => postMessage({type: "RNWC_PROPERTY_FUNCTION", func: k, params: [a, b, c, d, e, f, g]});
                                }
                            }

                            component.setState({
                                receivedStateString: event.data,
                                ...message
                            });
                        }
                    });

                }
                componentDidMount() {
                    let height = document.body.scrollHeight;
                    if (height != this.reportedHeight) {
                        this.reportedHeight = height;
                        postMessage({type: "RNWC_CONTENT_SIZE", height: height});
                    }
                }
                componentDidUpdate() {
                    let height = document.body.scrollHeight;
                    if (height != this.reportedHeight) {
                        this.reportedHeight = height;
                        postMessage({type: "RNWC_CONTENT_SIZE", height: height});
                    }
                }
                render() {
                    return createElement(InnerComponent, {
                        ...this.state,
                        ...mappedFunctions
                    });
                }
            }
            ConnectedComponent.isConnectedComponent = true;
            return ConnectedComponent;
        };
    } else {
        console.log("detected standard web component");
        // web component in normal use - call react redux
        return rrc(mapStateToProps, mapDispatchToProps, mergeProps, options);
    }
}


export function embedComponent(originalComponent) {
    if (!originalComponent) {
        return () => "Component " + window.componentKey + " not found";
    }

    if (originalComponent.isConnectedComponent) {
        // component already set up for redux
        return originalComponent;
    }
    else {
        return connect(
            originalComponent.mapStateToProps || (() => ({})),
            originalComponent.mapDispatchToProps || (() => ({})),
        )(originalComponent);
    }
}

