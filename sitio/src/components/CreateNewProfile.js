import React, { Component } from 'react';
import * as serverInfo from '../serverInfo';
import '../css/CreateNewProfile.css';

class CreateNewProfile extends Component
{

    cached_attributes = {};

    state = {
        tests:[],
        tests_selected:[],
        measuerd_attributes: {}
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
                        }
                    })
        }
        const { measuerd_attributes } = this.state;
        measuerd_attributes[test_code] = this.cached_attributes[test_code];
        this.setState(
            {
                measuerd_attributes: measuerd_attributes
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
            this.setState({
                measuerd_attributes: measuerd_attributes
            })
        }
        this.setState({
            tests_selected: tests_selected
        })
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

    getAttributesAsJsx = attributes_array => {
        /**
         * here we get the list of attributes that will be contained in the test div of the jsx
         */
        const attributes_jsx = [];
        attributes_array.forEach(attrib => {
            attributes_jsx.push((
                <div className="profile-test-attrib">
                    <h4 className="profile-test-attrib-name">{attrib}</h4>
                    <div className="profile-attrib-input">
                        <label>V.E</label>
                        <input type="text" maxLength='3'/>
                    </div>
                    <div className="profile-attrib-input">
                        <label>D.E</label>
                        <input type="text" maxLength='3'/>
                    </div>
                </div>
            ))
        })

        return attributes_jsx;
    }

    getTestsAttributesAsJsx = () => {
        const { measuerd_attributes } = this.state;
        if( Object.keys(measuerd_attributes).length > 0 )
        {
            const attribs_content = []; //the list that will contain the jsx

            Object.keys(measuerd_attributes).forEach(test_code => {
                const attributes = measuerd_attributes[test_code];
                attribs_content.push((
                    <div key={test_code} className="profile-testattribs-container">
                        <h2 className="profile-testattribs-code">{test_code}</h2>
                        {this.getAttributesAsJsx(attributes)}
                    </div>
                ))

            })

            return attribs_content;
        }
        return "Ah medida que selecciones pruebas, aqui apareceran los atributos que son medidos por estas";
    }

    render()
    {

        
        /* creating tests view */
                
        const {tests} = this.state;
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
                        <input type="text" maxLength='40' placeholder='Gerente, Autismo, Cualquier otro...'/>
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
                    <div id="profile-stats-conainer">
                        {attribs_content}
                    </div>
                    <div id="profile-controls">
                        <div id="create-profile-btn" className='not-ready-btn-state'>
                            <p>Crear</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default CreateNewProfile;