import React,{Component} from 'react';
import { connect } from 'react-redux'
import * as userActions from '../../actions/userActions';
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
            alert('contrasena de usuario requerida');
            return;
        }

        const { setUserdata } = this.props;
        const forma = new FormData();
        forma.append('user_name',name);
        forma.append('password',password_input.value);

        const request = new Request('http://ehonsar.000webhostapp.com/php/loginUsers.php',{method: 'POST',body: forma});
        fetch(request)
            .then(promise => promise.json())
            .then(response => {
                if(response.response==='ok')
                {
                    setUserdata(name,response.token,response.id);
                    historial.push('/main-menu');
                }
                else if(response.error)
                {
                    alert('error');
                }
            })
    }

    componentDidMount(){
        const { user_name, user_token } = this.props;
        if (user_name!==null && user_token!==null)
        {
            const forma = new FormData();
            forma.append('user_name',user_name);
            forma.append('token',user_token);

            const request = new Request('http://ehonsar.000webhostapp.com/php/validateUserToken.php',{method:'POST',body: forma});
            fetch(request)
                .then(promise => promise.json())
                .then(response => {
                    if(response.response === 'ok')
                    {
                        historial.push('/main-menu');
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
    return reducers.userReducer;
} 

export default connect(mapStateToProps,userActions)(LoginPage);