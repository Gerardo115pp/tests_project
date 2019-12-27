import React,{ Component } from 'react';
import '../css/Modal.css' ;

class ModalTests extends Component
{
    state = {
        tests:[],
        tests_selected:[]
    }

    async UNSAFE_componentWillMount()
    {
        const request = new Request("http://ehonsar.000webhostapp.com/php/getTests.php");
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

    closeModal = (e) => {
        if(e.target.id === this.props.use_id || e.target.id === 'modal-close-btn')
        {
            const {tests_selected} = this.state;
            this.props.callback(tests_selected);
            this.removeSelection();
            const modal = document.getElementById(this.props.use_id);
            modal.style.display='none'
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

    render()
    {
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
        return(
            <div onClick={this.closeModal} id={this.props.use_id} className="modal-background">
                <div id="tests-modal">
                    <div className="modal-title">
                        <h1 className="form-title">Selecciona los tests que quieres</h1>
                    </div>
                    <ul id="tests-list">
                        {test_list}
                    </ul>
                    <button id="modal-close-btn" onClick={this.closeModal} className='boton'>Listo</button>
                </div>
            </div>
        )
    }
}

export default ModalTests;