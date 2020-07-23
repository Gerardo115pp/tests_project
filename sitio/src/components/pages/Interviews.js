import React, { Component } from 'react';
import { connect } from 'react-redux';
import Test from '../../classes/Test';
import historial from '../historial';
import * as intervieweeActions from '../../actions/intervieweeActions';
import * as userActions from '../../actions/userActions';
import * as utActions from '../../actions/utActions';
import { server_name } from '../../serverInfo';
import '../../css/Interviewer.css';

class Interviews extends Component {
    
    constructor() 
    {
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
        /**
         * sets all the info needed for the interview, this info can come from a ut set on the store
         * or in the interviewee reducer.
         */
        if (this.props.ut.interview !== null && this.state.tests.length === 0) // check if the there is something in the ut reducer
        {
            console.log('loading ut')
            const { ut } = this.props;
            this.test_obj = new Test(ut.tests[ut.test_num]);
            this.interviewee_answers = ut.interviewee_answers;
            this.interviewee_stats = ut.interviewee_stats;
            this.setState({
                tests: ut.tests,
                question_num: ut.question_num,
                test_num: ut.test_num
            })
        }
        else if (this.state.tests.length === 0) // sets the interview info from the interviewee reducer
        {
            await this.props.intervieweeActions.get_tests();
            let { needed_tests } = this.props.intervieweeReducer;
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


    getInterviewDataAsUtPack = () => {
        /**
         * returns an object that has all the nesesary info about the interview to create a UT 
         */
        const { tests, question_num, test_num } = this.state;

        const interview_data = {
            tests,
            question_num,
            test_num,
            interviewee_answers: this.interviewee_answers,
            interviewee_stats: this.interviewee_stats,
            interviewee: this.props.intervieweeReducer.interviewee_key,
            interview: this.props.intervieweeReducer.interview_key,
            interviewer: this.props.userReducer.user_id
        };
        return interview_data;

    }

    catchOnGoingTest = () => {
        /**
         * stores the info about the current interview both in the redux store and the server
         * data is stored on the server so: the inteview can be resumed even if the user closes the browser
         * data is also stored on the server so: the interview presist thought reload(F5)
         */
        const interview_data = this.getInterviewDataAsUtPack();
        this.props.setUT(interview_data);
        const forma = new FormData();
        forma.append('interview_data', JSON.stringify(interview_data));

        const request = new Request(`${server_name}catchUnfinishedTest`,{method:'POST', body: forma});
        fetch(request)
            .then(promise => promise.json())
            .then(response => {
                if (response.response === 'bad')
                {
                    console.log('server couldnt save anwsers correctly...')
                }
            })
        


    }

    answerClickedHandler = e => {
        /**
         * Make the anwser that the user selected visualy visible anb it sets it on the component state
         */
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

    compileTest = (is_interview_over=false) => {
        /**
         * gets every value in interviewee_anwser and complies the all into one object
         * this object then is the one that is used to store the results of the interview.
         * how ever, the results will only be send over to the server if the parameter 'is_interview_over'
         * is true. 
         */
        const test_answers = Object.keys(this.interviewee_answers);
        let mide, results;
        this.interviewee_stats[this.test_obj.name] = {};
        for (let question_code of test_answers)
        {
            results = this.interviewee_answers[question_code];
            mide = results.mide;
            this.interviewee_stats[this.test_obj.name][mide] = (this.interviewee_stats[this.test_obj.name][mide]!==undefined) ? this.interviewee_stats[this.test_obj.name][mide]+results.value : results.value;
        }
        this.interviewee_answers = {};
        console.log(JSON.stringify(this.interviewee_stats));
        if (is_interview_over)
        {
            this.sendStats(is_interview_over);
        }
    }

    nextBtnClickedHandler = operation => {
        /**
         * this handles the navigation between one question and the next one or the previous one,
         * but it also handles the change between one test and the next one. its also the function that
         * has the responsability to decide when the interview is over and,
         * the data must be sent to de server and so it updates the status of the interview as a finished interview
         */
        if(this.state.selected_awnser !== null || operation==='-')//Is true if the user selected an answer or wants to go back to the previous question
        {
            this.resetAnswers();
            let { question_num } = this.state;
            if(operation === '+' && question_num < this.test_obj.length)// user clicket 'next' and there are questions remaing
            {   
                this.saveAnswer(question_num);
                this.setState({
                    question_num: question_num+1
                });
            }
            else if (operation === '-' && question_num > 1)// user clicked 'previous' and hi is not already in the first question
            {
                this.setState({
                    question_num: question_num-1
                });
            }
            else if( question_num === this.test_obj.length )// the test is done
            {
                let { test_num, tests } = this.state;
                if (test_num < (tests.length)-1)// there are more tests remaing
                {
                    this.compileTest();
                    this.test_obj = new Test(tests[test_num+1]);
                    this.setState({
                        test_num: test_num+1,
                        question_num:1
                    })
                }
                else // the interview is done
                {
                    this.compileTest(true);
                    console.log('interview done!');
                    const { user_id } = this.props.userReducer;
                    if(!/^testToken_[a-z\d]{40}$/.test(user_id))
                    {
                        historial.push('/test-menu');
                    }
                    else
                    {
                        historial.push('/interview-done');
                    }
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
            sets the answer components to ther original state both logicly and estheticly
        */
        if( this.state.selected_awnser !== null){
            if(!(/C[12]/g.test(this.test_obj.test_type)))// the answers are regular divs
            {
                this.resetAnswersColor();
            }
            else // the anwsers are check boxes
            {
                const { selected_awnser } = this.state;
                selected_awnser.checked = false;
            }
            this.setState({// makes it so the no answer appears selected (not refering to esthetics)
                selected_awnser: null
            })
        }
    }

    resetAnswersColor = () => {
        const answers_array = document.querySelectorAll('.awnser-text-container');
        answers_array.forEach(tag => tag.removeAttribute('style'));
    }

    saveAnswer = question_num => 
    {
        /**
         * gets the value of the user selected answer and what the current question is measuring
         * then it saves it in the interviewee_answers object, its also here where the 'catchOnGoingTest'
         * is called  
         */
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
        /**
         * this is the function that is called when the interview is over (which means that there are no more tests remaing)
         * when this function is called, the server will update the state of the interview as completed, which means that it will appear in
         * the results
         */
        let forma = new FormData();
        forma.append('key',this.props.intervieweeReducer.interview_key);
        forma.append('results',JSON.stringify(this.interviewee_stats));
        const request = new Request(`${server_name}handleResults`,{method: 'POST',body: forma});
        await fetch(request)
            .then(promise => promise.json())
            .then(response => {
                if (response.response === 'ok')
                {
                    console.log('interview_complete');
                }
                else 
                {
                    alert(response.msg);
                }
            })
    }
    

    selectProperCallback = () => {
        /**
         * it returns the correct callback that the answer component should have,
         * which will be the same to all except if the test type is C%i
         */
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
    const {intervieweeReducer, userReducer, utReducer} = reducers;
    return {
        'intervieweeReducer': intervieweeReducer,
        'userReducer': userReducer,
        'ut': utReducer
    }
}

const mapDispatchToProps = dispatch => {
    return {
        'userActions': userActions, 
        'intervieweeActions':  intervieweeActions,
        'setUT': ut => dispatch(utActions.setUT(ut))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Interviews)