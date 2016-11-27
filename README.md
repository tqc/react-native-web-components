# React Native Web Components

[ ![Codeship Status for tqc/react-native-web-components](https://app.codeship.com/projects/1c536090-9669-0134-0497-5672ad084bd7/status?branch=master)](https://app.codeship.com/projects/186947)

Use html react components in react-native apps

Html components are wrapped in a WebView, with properties and redux actions automatically copied between native and html components.

## Usage

In the web component, the code is similar to using react-redux

    import { connect } from 'react-native-web-components';
    class WebStartPage extends React.Component {...}
    export default connect(mapStateToProps, mapDispatchToProps)(TestComponent);

In the native app

    import TestComponent from "./testcomponent";
    import {WebWrapper} from "react-native-web-components/native";

      <View style={styles.container}>
        <WebWrapper component={TestComponent} />
      </View>

