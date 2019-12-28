import React, { Component } from 'react';
import { connect } from 'react-redux';
import Test from '../../classes/Test';
import historial from '../historial';
import * as intervieweeActions from '../../actions/intervieweeActions';
import { server_name } from '../../serverInfo';
import '../../css/Interviewer.css';

class Interviews extends Component {
    constructor() {
        super();
        this.test_obj = undefined;
        this.interviewee_answers = {};
        this.interviewee_stats = {};
        this.state = {
            tests: [],
            selected_awnser: null,
            question_num: 1,
            test_num: 0
        }
    }

    async componentDidMount() {
        if (this.state.tests.length === 0) {
            await this.props.get_tests();
            let { needed_tests } = this.props;
            let { test_num } = this.state;
            if (Array.isArray(needed_tests)) {
                this.test_obj = new Test(needed_tests[test_num]);
                this.setState({
                    tests: needed_tests
                });
                // this.test_obj.showData();
            }
            else {
                console.log('needed_tests is not an array.');
            }
        }
    }


    /*----------  Custom Functions  ----------*/


    catchOnGoingTest = () => {
        const { tests, question_num, test_num } = this.state;

        const forma = new FormData();
        forma.append('tests', tests);
        forma.append('question_num', question_num);
        forma.append('test_num', test_num);
        forma.append('interviewee_answers', this.interviewee_answers);
        forma.append('interviewee_stats', this.interviewee_stats);
        forma.append('interviewee', this.props.interviewee_key);
        


    }

    answerClickedHandler = e => {
        const answer_tag = e.currentTarget;
        this.resetAnswersColor();
        this.colorizeAnswerTag(answer_tag);
        this.setState({
            selected_awnser: answer_tag
        });
    }

    colorizeAnswerTag = answer_tag => {
        answer_tag.style.backgroundColor = 'rgb(0, 247, 255)';
        answer_tag.style.color = 'rgb(255, 255, 255)';
    }

    compileTest = () => {
        const test_answers = Object.keys(this.interviewee_answers);
        let mide, results;
        for (let question_code of test_answers)
        {
            results = this.interviewee_answers[question_code];
            mide = results.mide;
            this.interviewee_stats[mide] = (this.interviewee_stats[mide]!==undefined) ? this.interviewee_stats[mide]+results.value : results.value;
        }
        this.interviewee_answers = {};
        console.log(JSON.stringify(this.interviewee_stats));
        this.sendStats();
    }

    nextBtnClickedHandler = operation => {
        if(this.state.selected_awnser !== null || operation==='-')
        {
            this.resetAnswers();
            let { question_num } = this.state;
            if(operation === '+' && question_num < this.test_obj.length)
            {   
                this.saveAnswer(question_num);
                this.setState({
                    question_num: question_num+1
                });
            }
            else if (operation === '-' && question_num > 1)
            {
                this.setState({
                    question_num: question_num-1
                });
            }
            else if( question_num === this.test_obj.length)
            {
                let { test_num, tests } = this.state;
                // console.log(`tests_num: ${test_num}\ntest: ${tests.length}`);
                if (test_num < (tests.length)-1)
                {
                    this.compileTest();
                    this.test_obj = new Test(tests[test_num+1]);
                    this.setState({
                        test_num: test_num+1,
                        question_num:1
                    })
                }
                else{
                    this.compileTest();
                    console.log('interview done!');
                    historial.push('/main-menu');
                }
                
                
            }
        }
        else
        {
            alert('Debes seleccionar una respuesta');
        }
    }

    render() {
        let callback =  this.selectProperCallback()
        const { question_num } = this.state;
        const test_form = (this.test_obj!==undefined) ? this.test_obj.getTestJsx(question_num,callback) : null;
        return (
            <div id="main-container">
                <div id="tester-area">{test_form}</div>
                <div id="next-question-btn-container">
                    <button onClick={() => this.nextBtnClickedHandler('-')} className='boton-controls' id="previous-question-btn">anterior</button>
                    <button onClick={() => this.nextBtnClickedHandler('+')} className='boton-controls' id="next-question-btn">Siguiente</button>
                </div>
            </div>
        )
    }

    resetAnswers = () => {
        /*
            Hace que los componentes de las respuestas regresen a su estado original
        */
        if( this.state.selected_awnser !== null){
            if(!(/C[12]/g.test(this.test_obj.test_type)))
            {
                this.resetAnswersColor();
            }
            else
            {
                const { selected_awnser } = this.state;
                selected_awnser.checked = false;
            }
            this.setState({
                selected_awnser: null
            })
        }
    }

    resetAnswersColor = () => {
        const answers_array = document.querySelectorAll('.awnser-text-container');
        answers_array.forEach(tag => tag.removeAttribute('style'));
    }

    saveAnswer = question_num => {
        const test_type = this.test_obj.test_type;
        let answer = {};
        answer.mide = document.getElementById('a1-test-container').getAttribute('mide');
        
        const value_name = (/C[12]/g.test(test_type)) ? 'value' : 'valor';
    
        const { selected_awnser } = this.state;
        answer.value = parseInt(selected_awnser.getAttribute(value_name));

        this.interviewee_answers[`P${question_num}`] = answer;
        this.catchOnGoingTest()
    }

    sendStats = async () => {
        let forma = new FormData();
        forma.append('key',this.props.interview_key);
        forma.append('results',JSON.stringify(this.interviewee_stats));
        const request = new Request(`${server_name}handleResults`,{method: 'POST',body: forma});
        await fetch(request)
            .then(promise => promise.json())
            .then(response => {
                if (response.response === 'ok')
                {
                    console.log('test_saved');
                }
                else 
                {
                    alert(response.msg);
                }
            })
    }
    

    selectProperCallback = () => {
        if(this.test_obj !== undefined)
        {
            if (/C[12]/g.test(this.test_obj.test_type))
            {
                return e => {this.setState({selected_awnser:e.currentTarget})}
            }
            else
            {
                return this.answerClickedHandler;
            }
        }
    }

}

const mapStateToProps = reducers => {
    return reducers.intervieweeReducer
}

export default connect(mapStateToProps, intervieweeActions)(Interviews)