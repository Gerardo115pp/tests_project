export const setResults = (results,name_title) => {
    return {
        type: "set_results",
        results: results,
        name_title: name_title
    }
}

export const getResults = () => {
    return{
        type: 'get_results'
    }
}