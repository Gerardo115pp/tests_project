export const setUT = ut_data => {
    return {
        data: ut_data,
        type: 'setUT'
    }
}

export const clearUTdata = () => {
    return {
        type: 'clearUTdata'
    }
}