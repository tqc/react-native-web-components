# React Native Web Components

[ ![Codeship Status for tqc/react-native-web-components](https://app.codeship.com/projects/1c536090-9669-0134-0497-5672ad084bd7/status?branch=master)](https://app.codeship.com/projects/186947)

Use html react components in react-native apps

Html components are wrapped in a WebView, with properties and redux actions automatically copied between native and html components.

## Usage

In the web component, the code is similar to using react-redux

    import { connect } from 'react-native-web-components';
    class TestComponent extends React.Component {...}
    export default connect(mapStateToProps, mapDispatchToProps)(TestComponent);

In the native app

    import TestComponent from "./testcomponent";

      <View style={styles.container}>
        <TestComponent />
      </View>

Or with the router:

    function Wrap(WrappedComponent, options) {
        return function(props) {
            return (<WrappedComponent {...options} {...props} style={styles.htmlpage} backgroundColor='#999' />);
        };
    }
    
    <Scene key="testpage1" title="Test Web Component 1" component={TestComponent} />
    <Scene key="testpage2" title="Test Web Component 2" component={Wrap(TestComponent, {componentKey: "customkey"})} />

The componentKey property is optional, to be used when the scene key does not match the key used in the build process as the filename of the component script.

To correctly load the scripts for the web components, WebWrapper needs to know the url of the main js bundle, which is only available from native code. In index.ios.js: 


    import {WebWrapper, configureWebComponents} from "react-native-web-components/native";

    class TestApp extends Component {
        render() {
            configureWebComponents({
                mainBundleUrl: this.props.mainBundleUrl,
                useCombinedScript: true
            });
            return (
            <Provider store={store}>
              <Root2 />
            </Provider>
            );
        }
    }
    AppRegistry.registerComponent('TestApp', () => TestApp);

In AppDelegate.m, add the url to initialProperties:

    RCTRootView *rootView = [[RCTRootView alloc]
        initWithBundleURL:jsCodeLocation
        moduleName:@"WritingApp"
        initialProperties:@{@"mainBundleUrl" : jsCodeLocation.absoluteString}
        launchOptions:launchOptions];

# Build process

Each of the components needs an entry point script setting it up as a standalone react app. These scripts are assumed to be in `./rnwc/componentkey.js`:

    import {createElement} from "react";
    import {render} from "react-dom";
    import home from "@tqc/writing-app-client/ui/main/home";
    render(createElement(home), document.body);

A script is included to generate the necessary entry points:

    import {generateComponentScripts} from "react-native-web-components/build"

    let webComponents = [
        {
            key: "home",
            path: "./ui/main/home"
        },
        {
            key: "notifications",
            path: "./ui/main/notifications"
        }
    ];

    gulp.task("webcomponents", () => generateComponentScripts(webComponents));

# XCode setup

As well as the entry point scripts themselves, this will generate ./react-native-xcode.sh, which modifies the standard react-native script to include the component bundles in release app builds. 

In the build phase "Bundle React Native code and images", replace

    export NODE_BINARY=node
    ../node_modules/react-native/packager/react-native-xcode.sh

with

    export NODE_BINARY=node
    ../react-native-xcode.sh


# Additional components

## Routing

Since web and native apps do not share routing, navigation can't call the router directly. Redux reducers and actions are provided for react-router and react-native-router-flux.

    import {go, getNavReducer} from "react-native-web-components/router-native";
    let navReducer = getNavReducer();

or

    import {go, getNavReducer} from "react-native-web-components/router-web";

    let Routes = (
        <Route key="root" path="/" component={ConnectedApp}>
            ...
        </Route>
        );

    let navReducer = getNavReducer(Routes, hashHistory)

the rest of the code is the same for web and native:

    function mainReducer(store, currentState, action) {
        var state = currentState || initialState;
        if (!store) return state;
        // process custom actions here
        if (navReducer) state = navReducer(store, state, action);
        return state;
    }

    let store = createStore((a, b) => mainReducer(store, a, b), initialState);

    store.dispatch(go("routekey", {param: "value"}));

For react-native-router-flux, go() can pass the parameters directly to the router. For react-router, a mapping is needed. By default the key will be the last non-parameter segment of the route. If this is non-unique or otherwise unsuitable, simply add a key property to the Route element.


