const INITIAL_STATE = {
    user_name: null,
    user_token: null,
    user_id: null
}

export default (state = INITIAL_STATE, action) => {
    switch(action.type)
    {
        case 'set_userdata':
            return { ...state, user_name: action.name, user_token: action.token, user_id: action.id};
        default:
            return state;
    }
}