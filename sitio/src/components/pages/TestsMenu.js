import React,{Component} from 'react';
import {connect} from 'react-redux';
import '../../css/TestMenu.css';
import ModalTests from '../ModalTests';
import historial from '../historial';
import * as intervieweeActions from '../../actions/intervieweeActions';
import { isBlock } from '@babel/types';

class TestMenu extends Component
{

    state = {
        list_needed_tests: [],
        needed_tests: {}
    }

    backArrowHandler = e => {
        historial.push('/main-menu')
    }

    checkSelectIndex = () => {
        const select_tag = document.getElementById('test-type-selector');
        const selected_option = document.querySelector(`#test-type-selector option[value='${select_tag.selectedIndex}']`);
        if(selected_option.value === "4")
        {
            this.showModal('tests-modal-container');
        }
    }

    getSelectedTests = list => {
        this.setState({
            list_needed_tests:list
        })
    } 


    proceedToTests = async () => {
        
        /**
         *
         * Sends the data of the interviewed to the server, and requests the needed tests
         *
         */
        const {list_needed_tests} = this.state;
        let forma = new FormData();
        forma.append('name',document.getElementById('nombre-input').value);
        forma.append('needed',JSON.stringify(list_needed_tests));
        forma.append('user_id', this.props.user.user_id);
        let request = new Request('http://ehonsar.000webhostapp.com/php/createNewInterview.php',{method: 'POST',body:forma});
        const namer_tag = document.getElementById('nombre-input').value;
        await fetch(request)
                .then(promise => promise.json())
                .then(result => {
                    if(!result.error)
                    {
                        this.props.setInterviewee(result.tests,namer_tag,result.interviewee_key);
                        historial.push('/interviews');
                    }
                })
        
        
    }

    render(){
        return(
            <React.Fragment>
                <ModalTests callback={this.getSelectedTests} use_id={'tests-modal-container'} />
                <div id='main-container'>
                    <span onClick={this.backArrowHandler} id='back-arrow'><i className="fas fa-arrow-left"></i></span>
                    <div id="options-page" className="non-vertical">
                        <div id="form-options-container">
                            <div id="form-title-container">
                                <h1 className="form-title">Nuevo entrevistado</h1>
                            </div>
                            <fieldset id="inputs-container">
                                <div className='form-input-container'>
                                    <label htmlFor="nombre-input">nombre</label>
                                    <input type="text" id="nombre-input"/>
                                </div>
                                <div className='form-input-container'>
                                    <label htmlFor="test-type-selector">tipo de entrevista</label>
                                    <select onChange={this.checkSelectIndex} name="tts" id="test-type-selector">
                                        <option value="0">Jefe de cocina</option>
                                        <option value="1">Gerente general</option>
                                        <option value="2">Gerente de servicio</option>
                                        <option value="3">Hosts</option>
                                        <option value="4">Personalizado</option>
                                    </select>
                                </div>
                            </fieldset>
                            <div id="ok-btn-container">
                                <button id="test-menu-ok-btn" onClick={this.proceedToTests}>OK</button>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }

    showModal = (modal_id) => {
        const modal = document.getElementById(modal_id);
        if(isBlock(modal))
        {
            modal.style.display = 'none';
        }
        else
        {
            modal.style.display = 'block';
        }
    }
}

const mapStateToProps = reducers => {
    return {
        interviewee: reducers.intervieweeReducer,
        user: reducers.userReducer
    }
}

export default connect(mapStateToProps,intervieweeActions)(TestMenu);