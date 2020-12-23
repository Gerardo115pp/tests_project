export const setUserdata = (name,token,id) => {
    return {
        type: 'set_userdata',
        name: name,
        token: token,
        id:id
    }
}