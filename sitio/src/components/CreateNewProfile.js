import React, { Component } from 'react';
import CustomAlert from './customAlert';
import * as serverInfo from '../serverInfo';
import * as userActions from '../actions/userActions';
import '../css/CreateNewProfile.css';
import { connect } from 'react-redux';

class CreateNewProfile extends Component
{

    cached_attributes = {}; //used to catch the server response so it doesnt has to ask the server for attributes every time 
    profile_name = "";
    tests_profile_attribs = {}; //the json that has the v.e and d.e of each attribute

    state = {
        tests:[],
        tests_selected:[],
        measuerd_attributes: {},
        alert_message: "",
        is_profile_ready: false
    }

    async UNSAFE_componentWillMount()
    {
        const request = new Request(`${serverInfo.server_name}getTests`);
        if(this.state.tests.length === 0)
        {
            await fetch(request)
            .then(promise => promise.json())
            .then(response => {
                this.setState({
                    tests:response
                }
            )})
        }
    }

    requestTestAtrributes = async (test_code) => {
        
        
        /**
         *
         * here we requeste all the attributes that are measuerd by the selected tests,
         * this is called every time that the user select a test. if the requested test code is on
         * the cached attributes the it just takes it from there, otherwise it requests it from the server
         * and puts it into cached attributes.
         *
         * its been called from 'clickTestOptionHandler'.
         * 
         */
        
        
        if( !(test_code in this.cached_attributes) )
        {
            await fetch(`${serverInfo.server_name}getTesttAttributes/${test_code}/`)
                    .then(promise => promise.json())
                    .then(response => {
                        if (response.response !== 'bad')
                        {
                            // set it on the state and cache it on the 'cached_attributes' object
                            this.cached_attributes[test_code] = response.attribs;
                            const empty_attribs_obj = {}
                            response.attribs.forEach(attrib => {
                                empty_attribs_obj[attrib] = { VE: null, DE: null }
                            })
                            this.tests_profile_attribs[test_code] = empty_attribs_obj;
                        }
                    })
        }
        const { measuerd_attributes } = this.state;
        measuerd_attributes[test_code] = this.cached_attributes[test_code];
        this.setState(
            {
                measuerd_attributes: measuerd_attributes,
                is_profile_ready: false
            }
        )
    }

    clickTestOptionHandler = e => {
        let {tests_selected} = this.state;
        const test_li = e.currentTarget;
        const test_code = test_li.getAttribute('test_code');
        if(!tests_selected.includes(test_code))
        {
            tests_selected.push(test_code);
            test_li.style.backgroundColor = 'rgb(0, 247, 255)';
            test_li.style.color = 'rgb(255,255,255)';
            this.requestTestAtrributes(test_code);
        }
        else
        {
            tests_selected = tests_selected.filter(x => x !== test_code);
            test_li.removeAttribute('style');
            const { measuerd_attributes } = this.state;
            delete measuerd_attributes[test_code];
            delete this.tests_profile_attribs[test_code];
            this.setState({
                measuerd_attributes: measuerd_attributes
            })
        }
        this.setState({
            tests_selected: tests_selected
        })
        this.isDataEnought(false, tests_selected);
    }

    removeSelection = () => {
        this.setState({
            tests_selected:[]
        });
        const test_options = document.querySelectorAll('.test-option');
        test_options.forEach((item,index) => {
            item.removeAttribute('style');
        })

    }

    closeSelf = e => {
        const element = e.target;
        if( element.getAttribute('id') === 'newprofile-modal-background')
        {
            element.removeAttribute('style');
        }
    }

    handleDeVeClick = e => {
        const element = e.target;
        let object_code = element.getAttribute("oc").split("]");
        this.tests_profile_attribs[object_code[0]][object_code[1]][object_code[2]] = element.value;
    }

    getAttributesAsJsx = (attributes_array, test_atrribs_object, test_code) => {
        /**
         * here we get the list of attributes that will be contained in the test div of the jsx
         */
        const attributes_jsx = [];
        attributes_array.forEach(attrib => {
            attributes_jsx.push((
                <div key={attrib} className="profile-test-attrib">
                    <h4 className="profile-test-attrib-name">{attrib}</h4>
                    <div className="profile-attrib-input">
                        <label>V.E</label>
                        <input onChange={this.handleDeVeClick} oc={`${test_code}]${attrib}]VE`} type="text" maxLength='3'/>
                    </div>
                    <div className="profile-attrib-input">
                        <label>D.E</label>
                        <input onChange={this.handleDeVeClick} oc={`${test_code}]${attrib}]DE`} type="text" maxLength='3'/>
                    </div>
                </div>
            ))
            test_atrribs_object[attrib] = {
                VE: null,
                DE: null
            }
        })

        return attributes_jsx;
    }

    validateAttributesData = () => {
        let response = false;
        if( Object.keys(this.tests_profile_attribs).length > 0)
        {
            response = true;
            for(let test of Object.keys(this.tests_profile_attribs))
            {
                if(response)
                {                    
                    for(let attrib of Object.keys(this.tests_profile_attribs[test]))
                    {
                        if(!(/^\d+$/.test(this.tests_profile_attribs[test][attrib].VE)) || !(/^\d+$/.test(this.tests_profile_attribs[test][attrib].DE)))
                        {
                            response = false;
                            break;
                        } 
                    }
                }
                else
                {
                    break;
                }
            }

        }
        return response;
    }

    getTestsAttributesAsJsx = () => {
        const { measuerd_attributes } = this.state;
        if( Object.keys(measuerd_attributes).length > 0 )
        {
            const attribs = [];
            Object.keys(measuerd_attributes).forEach(test_code => {
                const attributes = measuerd_attributes[test_code],
                      test_atrribs_object = {};
                attribs.push((
                    <div key={test_code} className="profile-testattribs-container">
                        <h2 className="profile-testattribs-code">{test_code}</h2>
                        {this.getAttributesAsJsx(attributes, test_atrribs_object, test_code)}
                    </div>
                ))
                if( !(test_code in this.tests_profile_attribs) )
                {
                    this.tests_profile_attribs[test_code] = test_atrribs_object;
                }
            })

            return attribs;
        }
        return "Ah medida que selecciones pruebas, aqui apareceran los atributos que son medidos por estas";
    }

    isDataEnought = (set_messeges=false,tests_selected=this.state.tests_selected) => {
        const { is_profile_ready, alert_message } = this.state; 
        let is_enought = true,
            new_alert_message = alert_message;
        

        if (!(/^[\sa-zA-Z\dñ]+$/.test(this.profile_name))){
            is_enought = false;
            new_alert_message = "Nombre de perfil Invalido";
        }
        else if( tests_selected.length === 0 )
        {
            is_enought = false;
            new_alert_message = "Ninguna prueba a sido asignada para este perfil";
        }
        else if (!this.validateAttributesData())
        {
            is_enought = false;
            new_alert_message = "Quedan valores sin llenar entre los atributos de las pruebas";
        }
        
        /**
         * Hay que verificar tambien que esten llenos 
         */
        const new_state = {};
        
        if (is_enought !== is_profile_ready)
        {
            new_state["is_profile_ready"] = is_enought; 
        }

        if ( set_messeges && alert_message !== new_alert_message)
        {
            new_state["alert_message"] = new_alert_message;
        }

         this.setState(new_state);
    }


    createProfile = () => {
        if(this.state.is_profile_ready)
        {
            const profile_json = {
                name: this.profile_name,
                values: this.tests_profile_attribs
            }

            const forma = new FormData();
            forma.append("profile", JSON.stringify(profile_json));
            forma.append("user", this.props.user_reducer.user_id);

            const request = new Request(`${serverInfo.server_name}createProfileForUser`, {method: 'POST', body: forma});
            fetch(request)
                .then(promise => promise.json())
                .then(response => {
                    if( response.response === 'ok')
                    {
                        this.props.callback();
                        document.getElementById('newprofile-modal-background').removeAttribute('style');
                    }
                })


        }
        else
        {
            this.isDataEnought(true);
        }
    }

    render()
    {

        
        /* creating tests view */
                
        const { tests, is_profile_ready } = this.state;
        const test_list = []
        let h=0;
        for(let name of Object.keys(tests))
        {
            test_list.push(
                <li onClick={this.clickTestOptionHandler} test_code={tests[name]} key={h} className='test-option'>
                    <h5 className="test-option-text">{name}</h5>
                </li>
            )
            h++;
        }

        const attribs_content = this.getTestsAttributesAsJsx();
        return(
            <div onClick={this.closeSelf} id="newprofile-modal-background">
                
                <div id="newprofile-form-container">
                    <div id="profile-name-container">
                        <label htmlFor="">Nombre del perfil</label>
                        <input onChange={e => { this.profile_name = e.target.value;}} onBlur={e => this.isDataEnought()} type="text" maxLength='40' placeholder='Gerente, Autismo, Cualquier otro...'/>
                    </div>
                    <div id="alertsbox">
                        <CustomAlert alert_message={this.state.alert_message}/> {/* this is where the alert messeges are displayed */}
                    </div>
                    <div id="profile-tests-container">
                        {/* agregar seleccion dinamica */}
                        <div className="messege-descriptor">
                            <h5>Selecciona los tests que debe tomar este perfil..</h5>
                        </div>
                        <ul id="tests-list">
                            {test_list}
                        </ul>
                    </div>
                    <div onBlur={e => {this.isDataEnought()}} id="profile-stats-conainer">
                        {attribs_content}
                    </div>
                    <div id="profile-controls">
                        <div onClick={this.createProfile} id="create-profile-btn" className={ is_profile_ready ? 'ready-btn-state' : 'not-ready-btn-state'}>
                            <p>Crear</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = reducers => {
    return {
        'user_reducer': reducers.userReducer
    }
}

export default connect(mapStateToProps, userActions)(CreateNewProfile);