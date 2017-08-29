export function go(pageId, params) {
    return {
        type: "GO",
        pageId,
        ...params
    };
}

export function getNavReducer(Routes, history) {
    var routemap = {};

    function autoMap(parentPath, route, result) {
        result = result || {};
        var currentPath = parentPath;
        if (currentPath != "/" && route.props.path) currentPath += "/";
        if (route.props.path && route.props.path != "/") currentPath += route.props.path;
        if (route.props.children && route.props.children.length) {
            for (let i = 0; i < route.props.children.length; i++) {
                autoMap(currentPath, route.props.children[i], result);
            }
        }
        else {
            var key = currentPath;
            var segments = currentPath.split("/").filter(s => s.length > 0 && s.indexOf(":") != 0);

            if (route.key) {
                key = route.key;
            }
            else if (route.props.key) {
                key = route.props.key;
            }
            else if (segments.length && !result[segments[segments.length - 1]]) {
                key = segments[segments.length - 1];
            }
            else {
                console.warn("Specify a unique key for route " + currentPath);
            }


            result[key] = (p) => {
                var m = currentPath.match(/:\w+/g) || [];
                var resolvedPath = currentPath;
                for (let i = 0; i < m.length; i++) {
                    resolvedPath = resolvedPath.replace(m[i], p[m[i].substr(1)]);
                }
                return resolvedPath;
            };


        }
        return result;
    }

    routemap = autoMap("", Routes, routemap);


    return function navigationReducer(store, state, action) {
        if (action.type != "GO") return state;
        console.log("Navigating...");
        console.log(action);
        if (routemap[action.pageId]) {
            var to = routemap[action.pageId]({...state.routeData, ...action});
            console.log(to);
            history.push(to);
            return {...state, routeData: {...state.routeData, ...action}};
        }
        else {
            console.warn(`route ${action.pageId} is not mapped`);
        }
        return state;
    };
}