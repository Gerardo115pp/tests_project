export const setResults = (results,name_title, profile) => {
    return {
        type: "set_results",
        results: results,
        profile: profile,
        name_title: name_title
    }
}

export const setTestDictonary = test_dict => {
    return {
        test_dict,
        type: "set_test_dictionary"
    }
}

export const getResults = () => {
    return{
        type: 'get_results'
    }
}