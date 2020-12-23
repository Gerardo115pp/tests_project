import React,{Component} from 'react';
import { connect } from 'react-redux'
import * as serverInfo from '../../serverInfo';
import * as userActions from '../../actions/userActions';
import * as utActions from '../../actions/utActions';
import * as intervieweeActions from '../../actions/intervieweeActions';
import '../../css/login.css';
import historial from '../historial';

class LoginPage extends Component
{
    loginHandler = () => {
        const name = document.getElementById('user-login').value;
        const password_input = document.getElementById('password-login');
        /**
         *
         * validating that both inputs are not empty
         *
         */
        if (name==='')
        {
            alert('nombre de usuario requerido');
            return;
        }
        else if (password_input.value==='')
        {
            alert('contraseña de usuario requerida');
            return;
        }

        const { setUserdata } = this.props;
        const forma = new FormData();
        forma.append('user_name',name);
        forma.append('password',password_input.value);

        const request = new Request(`${serverInfo.server_name}loginUsers`,{method: 'POST',body: forma});
        fetch(request)
            .then(promise => promise.json())
            .then(response => {
                if(response.response==='ok')
                {
                    setUserdata(name,response.token,response.id);
                    historial.push('/test-menu');
                }
                else if(response.error)
                {
                    alert('error');
                }
            })
    }

    searchForTestToken = url_params => {
        if(url_params !== "")
        {
            url_params = url_params.slice(1);
            url_params = url_params.split('&');
            if(url_params.length === 1)
            {
                const token = url_params[0].split('=')[1]
                if(/^[a-z\d]{40}$/.test(token))
                {
                    console.log(token);
                    return token;
                }
            }
        }
        return "";
    } 

    prepareTestTokenUser = token => {
        const user_reducer_data = `testToken_${token}`;
        this.props.setUserdata(user_reducer_data, user_reducer_data, user_reducer_data);
        fetch(`${serverInfo.server_name}getTestTokenInfo/${token}/`)
            .then(promise => promise.json())
            .then(response => {
                this.props.clearUTdata();
                this.props.setInterviewee(response.needed_tests,user_reducer_data, response.interviewee, token);
                this.props.setUT(response.cached);
                historial.push('/interviews')
            })
    }

    componentDidMount(){
        const { user_name, user_token } = this.props.userReducer;
        const test_token = this.searchForTestToken(this.props.location.search);
        if(test_token !== "")
        {
            this.prepareTestTokenUser(test_token);
        }
        else if (user_name!==null && user_token!==null)
        {
            const forma = new FormData();
            forma.append('user_name',user_name);
            forma.append('token',user_token);

            const request = new Request(`${serverInfo.server_name}validateUserToken`,{method:'POST',body: forma});
            fetch(request)
                .then(promise => promise.json())
                .then(response => {
                    if(response.response === 'ok')
                    {
                        historial.push('/test-menu');
                    }
                    else if(response.response === 'invalid')
                    {
                        console.log("invalid token");
                        this.props.setUserdata(null,null,null);
                    }
                })
        }
    }

    render(){
        return(
            <React.Fragment>
                <div id="login-container">
                    <div id="user-img-container">
                        <span><i className="fas fa-user"></i></span>
                    </div>
                    <div id='fields-container'>
                        <div className="field-container">
                            <label htmlFor="user-login">usuario</label>
                            <input id='user-login' type="text"/>
                        </div>
                        <div className="field-container">
                            <label htmlFor="password-login">password</label>
                            <input id='password-login' type="password"/>
                        </div>
                        <div className="field-container">
                            <input id='login-btn' onClick={this.loginHandler} type="button" value='log'/>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

const mapStateToProps = reducers => {
    return {
        'userReducer': reducers.userReducer,
        'utReducer': reducers.utReducer,
        'intervieweeReducer': reducers.intervieweeReducer
    };
} 

const mapDispatchToProps = dispatch => {
    return {
        'setUserdata': (name, token, id) => dispatch(userActions.setUserdata(name, token ,id)),
        'clearUTdata': () => dispatch(utActions.clearUTdata()),
        'setUT': ut => dispatch(utActions.setUT(ut)),
        'setInterviewee': (tests, name, key, interview) => dispatch(intervieweeActions.setInterviewee(tests, name, key, interview))
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(LoginPage);