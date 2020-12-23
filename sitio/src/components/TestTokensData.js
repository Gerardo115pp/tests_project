import React, { Component } from 'react';
import { connect } from 'react-redux';
import '../css/TestTokenData.css';
import { server_name, served_on } from '../serverInfo';

class TestTokenData extends Component
{
    is_modal_showing = false;
    interviewees = {};
    state = {
        tokens: []// the data from the user tokens
    }

    componentDidMount()
    {
        this.props.refresh(this.showSelf);
    }

    showSelf = () => {
        const element = document.getElementById('test-token-data-background');
        element.style.display = this.is_modal_showing ? 'none' : 'block';
        this.is_modal_showing = !this.is_modal_showing;
        this.requestTokensData();
    }

    deleteToken = e => {
        const { currentTarget:element } = e;
        const interivewee_id = this.interviewees[element.getAttribute('token')];
        const forma = new FormData();

        forma.append('id', interivewee_id);

        const request = new Request(`${server_name}deleteInterviewee`, {method: 'POST', body: forma});
        fetch(request)
            .then(promise => promise.json())
            .then(response => {
                if(response.response === 'ok')
                {
                    this.requestTokensData();
                }
            })
    }

    copyToken = e => {
        const { currentTarget: element } = e;
        if(element.getAttribute('class').includes('user-ttoken'))
        {
            const token_url = `${served_on}?token=${element.getAttribute('token')}`;
            const text_element = element.querySelector(".interviewee-name input");
            const interviewee_name = text_element.value;
            text_element.value = token_url; 
            text_element.select();
            document.execCommand('copy');
            text_element.value = interviewee_name; 

        }
    }

    convertResponseToJsx = response => {
        const tokens = [];
        this.interviewees = {};
        for(let token of Object.keys(response))
        {
            tokens.push(
                <div key={token} token={response[token].id} onClick={this.copyToken} className={`user-ttoken ${response[token].was_finished === 1 ? 'token-test-done' : 'token-test-pending' }`}>
                    <div className="token-upper-info-container">
                        <div className="interviewee-name"><input value={response[token].interviewee} readOnly/></div>
                        <div className="token-status">{response[token].was_finished === 1 ? 'terminada' : 'pendiente'}</div>
                        <div token={token} onClick={this.deleteToken} className="del-btn"><i className="material-icons">clear</i></div>
                    </div>
                    <div className="token-info">
                        <div className="profile-name">{response[token].profile}</div>
                        <div className="creation-date">Creado el {response[token].created}</div>
                    </div>
                </div>
            );
            this.interviewees[token] = response[token].interviewee_key;
        }
        this.setState({
            ...this.state,
            tokens
        })
    }
    
    requestTokensData = () => {
        const { user_id } = this.props.user;
        
        const forma = new FormData();
        forma.append('user', user_id);
        
        const request = new Request(`${server_name}get-user-tokens`, {method: 'POST', body: forma});
        fetch(request)
        .then(promise => promise.json())
        .then(response => {
                if(Object.keys(response).length !== this.state.tokens.length)
                {
                    this.convertResponseToJsx(response);
                }
            })
        }
        
        render()
        {
            const { tokens: tokens_jsx } = this.state;
            return(
                <div id="test-token-data-background">
                    <div id="ttd-main-container">
                        <div id="ttd-title">
                            <h4>Tokens creados</h4>
                        </div>
                        <div id="tokens-container">
                            {tokens_jsx}
                        </div>
                        <div id="ttd-close-btn">
                            <i onClick={this.showSelf} className="material-icons">keyboard_arrow_down</i>
                        </div>
                    </div>
                </div>
            )
    }
}

const mapStateToProps = reducers => {
    return {
        user: reducers.userReducer
    }
}

export default connect(mapStateToProps)(TestTokenData);