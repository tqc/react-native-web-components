import {
    Actions
} from 'react-native-router-flux';

export function go(pageId, params) {
    return {
        type: "GO",
        pageId,
        ...params
    };
}

export function getNavReducer() {

    return function navReducer(store, state, action) {
        if (action.type != "GO") return state;
        console.log("Navigating...");
        console.log(action);
        if (Actions[action.pageId]) {
            let params = {
                ...action
            };

            delete params.key;
            delete params.pageId;
            delete params.type;

            console.log("found action");
            console.log(params);

            Actions[action.pageId](params);
            return {...state, routeData: {...state.routeData, ...action}};
        }
        else {
            console.error(`route ${action.pageId} is not mapped`);
        }
        return state;
    };
}
