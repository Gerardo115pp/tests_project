import React, { Component } from 'react';
import * as serverInfo from '../serverInfo';
import '../css/CreateNewProfile.css';

class CreateNewProfile extends Component
{

    state = {
        tests:[],
        tests_selected:[]
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

    clickTestOptionHandler = e => {
        let {tests_selected} = this.state;
        const test_li = e.currentTarget;
        const test_code = test_li.getAttribute('test_code');
        if(!tests_selected.includes(test_code))
        {
            tests_selected.push(test_code);
            test_li.style.backgroundColor = 'rgb(0, 247, 255)';
            test_li.style.color = 'rgb(255,255,255)';
        }
        else
        {
            tests_selected = tests_selected.filter(x => x !== test_code);
            test_li.removeAttribute('style');
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



        const stats_content = "Ah medida que seleccione las los pruebas, aqui apareceran los atributos que seran medidos"
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
                        {stats_content}
                    </div>
                    <div id="profile-controls">
                        <div id="create-profile-btn">
                            <p>Crear</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default CreateNewProfile;