import React, { Component } from 'react';
import "../css/CreateNewTest.css";
import { golang_name } from '../serverInfo';



const zeros = n => {
    let x = new Array(n);
    x.fill(0);
    return x;
}

class NewTestCreator extends Component 
{
    constructor(props) {
        super(props);
        this.save_state_routine = undefined;
        this.test_completness_verifier = undefined;
        this.current_state_changes = 0;
        this.last_state_change = 0;
        this.state = {
            questions: {},
            measures: [],
            awnsers: [],
            short_name: "",
            test_name: "",
            short_name_exists: false,
            test_name_exists: false,
            is_test_complete: false
        }
    }

    componentDidMount() {
        if(this.save_state_routine !== undefined) {
            window.clearInterval(this.save_state_routine);
        }
        this.save_state_routine = window.setInterval(this.saveState, 60000);
    }

    componentDidUpdate() {
        this.current_state_changes++;
    }

    componentWillUnmount() {
        window.clearInterval(this.save_state_routine);
    }

    addQuestion = () => {
        const count =  parseInt(document.querySelector("#question-adder-btn input").value);

        let { questions } = this.state;
        let question_counter = Object.keys(questions).length;
        if (count > Object.keys(questions).length) {
            const awnsers_size = this.state.awnsers.length > 0 ? this.state.awnsers.length : 1;
            do {
                question_counter++;
                questions[`q${question_counter}`] = {
                    title: undefined,
                    stat: undefined,
                    awnsers_values: zeros(awnsers_size)
                };
            } while(count !== question_counter);
        } else if (count < Object.keys(questions).length) {
            const new_questions_set = {};
            question_counter = 0;
            for(let q of Object.keys(questions)) {
                if (count <= question_counter) {
                    break;
                }
                new_questions_set[`q${question_counter}`] = q;
                question_counter++;
            }
            questions = new_questions_set;
        }
        this.setState({
            ...this.state,
            questions
        });
    }


    addMeasure = e => {
        const count = parseInt(e.target.value);
        let { measures } = this.state;
        if (count !== measures.length) {
            measures = this.resizeArray(count, measures);
            this.setState({
                ...this.state,
                measures
            });
        }
    }

    addAwnser = e => {
        const count = parseInt(e.target.value);
        let { awnsers, questions } = this.state;
        if(awnsers.length !== count) {
            awnsers = this.resizeArray(count, awnsers);
            Object.keys(questions).forEach(q => {questions[q].awnsers_values = zeros(count)});
            this.setState({
                ...this.state,
                questions,
                awnsers
            });
        }
    }

    getNewTestData = () => {
        const { test_name, short_name, awnsers, measures, questions } = this.state;
        return {
            test_name,
            short_name,
            awnsers,
            measures,
            questions
        }
    }

    isStateEmpty = () => {
        const { awnsers, measures, questions, short_name, test_name } = this.state;
        return awnsers.length > 0 && measures.length > 0 && Object.keys(questions) > 0 && short_name !== "" && test_name !== "";
    }

    isTestComplete = () => {
        const {
            awnsers,
            questions,
            measures,
            test_name,
            short_name
        } = this.state;
        let is_complete = true;
        if (short_name === "") {
            is_complete = false;
        } else if (test_name === "") {
            is_complete = false;
        }

        if (measures.length === 0 ) {
            is_complete = false;
        } else if (is_complete) {
            for(let m of measures) {
                if (m === undefined) {
                    is_complete = false;
                    break;
                }
            }
        } 

        if(awnsers.length === 0) {
            is_complete = false;
        } else if(is_complete) {
            for(let a of awnsers) {
                if (a === undefined) {
                    is_complete = false;
                    break;
                }
            }
        }

        if (Object.keys(questions).length === 0) {
            is_complete = false;
        } else if(is_complete) {
            for(let q of Object.keys(questions)) {
                if(questions[q].title === undefined){
                    is_complete = false;
                    break;
                }
            }
        }

        console.log(`is test complete: ${is_complete}`);
        if(this.state.is_test_complete !== is_complete) {
            this.setState({
                ...this.state,
                is_test_complete: is_complete
            });
        }
    }

    saveState = () => {
        if(!this.isStateEmpty() && this.current_state_changes > this.last_state_change) {
            this.last_state_change = this.current_state_changes;
            const test_state = JSON.stringify(this.getNewTestData());
            
            const forma = new FormData();
            forma.append("test_state", test_state);
            forma.append("test_name", this.state.test_name);

            const request = new Request(`${golang_name}/save-test-check-point`, {body: forma, method: "POST"});
            fetch(request);
        }
    }

    resizeArray = (count, arr) => {
        if(typeof count !== Number) {
            count = parseInt(count);
        }

        if (count > arr.length) {
            do {
                arr.push(undefined);
            } while(count !== arr.length);
        } else if ( count < arr.length && count > 0) {
            arr = arr.slice(0,count);
        }
        return arr;
    }

    getMeasuerdValuesView = () => {
        const  { measures } = this.state;
        if (measures.length > 0) {
            return measures.map((itm, h) => {
                return <div key={`ct-measure-value-${h}`} className="measured-value-container"><input id={`measured-${h}`} onBlur={this.updateMeasuredValues} type="text" placeholder="Atributo.." defaultValue={itm !== undefined ? itm : ""}/></div>
            });
        } else {
            return "No Measuerd Values enterd..."
        }
    }

    getPossibleAwnsers = () => this.state.awnsers;

    getMeausredValues = () => this.state.measures;

    triggerIfEnter = (e, callback, do_callback=true) => {
        if(e.key === "Enter") {
            if (do_callback) {
                callback(e);
            }
            e.target.blur();
        }
    }

    loadTestCheckPoint = test_name => {
        const forma = new FormData();
        forma.append("test_name", test_name);
        const request = new Request(`${golang_name}/load-test-check-point`, {method: "POST", body: forma});
        fetch(request)
            .then(promise => {
                if (promise.status === 200) {
                    return promise.json();
                }
                return null;
            })
            .then(response => {
                console.log(response)
                if (response !== null) {
                    console.log("not null")
                    this.setState({
                        ...this.state,
                        awnsers: response.awnsers,
                        measures: response.measures,
                        questions: response.questions,
                        test_name: response.test_name,
                        short_name: response.short_name
                    }, () => {
                        this.updateInputsToCheckPoint(response);
                        this.isTestComplete();
                    });
                }
            })
    }

    updateMeasuredValues = e => {

        const { target } = e;
        const { measures } = this.state;
        const measure_index = parseInt(target.id.split("-")[1]);
        const current_value = measures[measure_index];
        measures[measure_index] = target.value;
        if (current_value !== measures[measure_index]) {
            this.setState({
                ...this.state,
                measures
            }, this.isTestComplete);
        }
    }

    updateQuestionAwnserValue = (question_uuid, awnser_index, new_value) => {
        const { questions } = this.state;
        if ((typeof new_value) === "string") {
            new_value = parseInt(new_value);
        }
        questions[`q${question_uuid + 1}`].awnsers_values[awnser_index] = new_value;
        this.setState({
            ...this.state,
            questions
        })
    }

    updateAwnser = (anwser_index, awnser_title) => {
        if (awnser_title !== "") {
            const { awnsers } = this.state;
            awnsers[anwser_index] = awnser_title;
            this.setState({
                ...this.state,
                awnsers
            }, this.isTestComplete);
        }
    }

    updateInputsToCheckPoint = checkpoint => {
        const awnsers_count_input = document.querySelector("#awnsers-p-question-input input");
        const questions_count_input = document.querySelector("#question-adder-btn input");
        const measures_count_input = document.querySelector("#measured-values-adder-btn input");
        awnsers_count_input.value = checkpoint.awnsers.length;
        questions_count_input.value = Object.keys(checkpoint.questions).length;
        measures_count_input.value = checkpoint.measures.length;
    }

    verifyShortName = () => {
        const short_name = document.querySelector("#test-shortname-input input").value;
        if(short_name !== "") {
            fetch(`${golang_name}/does-shortname-exists?field_value=${short_name}`)
                .then(promise => promise.json())
                .then(response => {
                    this.setState({
                        ...this.state,
                        short_name_exists: response.response,
                        short_name
                    }, this.isTestComplete)
                })
        }
    }

    verifyTestName = () => {
        const full_name = document.querySelector("#test-name-input input").value;
        if(full_name !== "") {
            fetch(`${golang_name}/does-testname-exists?field_value=${full_name}`)
                .then(promise => promise.json())
                .then(response => {

                    const callback = response.response ? () => {} : this.loadTestCheckPoint(full_name);

                    this.setState({
                        ...this.state,
                        test_name_exists: response.response,
                        test_name: full_name
                    }, callback);
                })
        }
    }

    questionUpdate = (quuid, question_new_data) => {
        const { questions } = this.state;
        questions[quuid] = question_new_data;
        this.setState({
            ...this.state,
            questions
        });
    }

    render() 
    {
        const { questions, is_test_complete } = this.state,
        test_title_color = is_test_complete ? "#3fff00" : "black";

        return(
            <div id="new-test-background">
                <div id="new-test-container">
                    <h1 style={{color: test_title_color}} id="cnt-title">Test Creator</h1>
                    <CNTinput on_blur={this.verifyTestName} on_keydown={e => this.triggerIfEnter(e, this.verifyTestName, false)} has_errors={this.state.test_name_exists} warning_msg="this name is not avaliable" uuid="test-name-input" label_name="Nombre de la prueba" placeholder="new test name..."/>
                    <div id="cnt-middle-options">
                        <div id="cnt-measured-values-container">
                            <div id="cnt-mv-values">
                                {this.getMeasuerdValuesView()}
                            </div>
                            <div id="measured-values-adder-btn" className="adder-btn">
                                <input onBlur={this.addMeasure} onKeyDown={e => this.triggerIfEnter(e, this.addMeasure)} type="number" min="0" defaultValue="0"/>
                            </div>
                        </div>
                        <div id="cnt-middle-linear-test-data">
                            <CNTinput on_keydown={e => this.triggerIfEnter(e, this.addAwnser)} on_blur={this.addAwnser} uuid="awnsers-p-question-input" label_name="N.respuestas" default_value={0} minimal_value={0} type="number"/>
                            <CNTinput on_blur={this.verifyShortName} on_keydown={e => this.triggerIfEnter(e, this.verifyShortName)} has_errors={this.state.short_name_exists} uuid="test-shortname-input" label_name="shortname" warning_msg="short name in use" placeholder="CNT.. or something" default_value={this.state.short_name}/>
                        </div>
                    </div>
                    <div id="cnt-questions-container">
                        {Object.keys(questions).map((q, h) => {
                            return <QuestionEditorComponent uuid={h} question_id={q} updateAwnserValueCallback={this.updateQuestionAwnserValue} updateAwnserCallback={this.updateAwnser} updateQuestionCallback={this.questionUpdate} getPossibleAwnsers={this.getPossibleAwnsers} getMeausredValues={this.getMeausredValues} question__data={questions[q]}/>
                        })}
                        <button className="adder-btn" id="question-adder-btn">
                            <input onKeyDown={e => this.triggerIfEnter(e, this.addQuestion)} onBlur={this.addQuestion} type="number" min="0" defaultValue="0"/>
                        </button>
                    </div>
                </div>
            </div>
        )
    }
}

const QuestionEditorComponent = props => {

    const { uuid, question__data:data, updateQuestionCallback, question_id, updateAwnserCallback, updateAwnserValueCallback  } = props;

    const updateQuestionData = () => {
        let self_uuid = `#question-editor-${uuid}`;
        const measures_options = document.querySelector(`${self_uuid} select`),
              title_element = document.querySelector(`${self_uuid} .qe-title input`);

        data.title =  title_element.value;
        data.stat = measures_options.value;
        updateQuestionCallback(question_id, data);
    }
    const possible_awnsers = props.getPossibleAwnsers();
    const measures = props.getMeausredValues();

    const updateAnwserOnEnter = (event_obj, anwser_index, callback) => {
        if (event_obj.key === "Enter" && event_obj.target.value !== "") {
            const { target } = event_obj;
            callback(anwser_index, target.value);
        }
    }

    const getAwnsersView = () => {
        if (possible_awnsers.length > 0) {
            return possible_awnsers.map((itm, h) => {
                const awnser_current_value = h < data.awnsers_values.length ? data.awnsers_values[h] : 0;
                return (
                    <div key={`qe-awnser-${h}`} className="possible-awnser-container">
                        <input onKeyDown={e => updateAnwserOnEnter(e, h, updateAwnserCallback)} onBlur={e => updateAwnserCallback(h, e.target.value)} type="text" className="awnser-title" placeholder="empty anwser" defaultValue={itm !== undefined ? itm : ""}/>
                        <p>:</p>
                        <input onBlur={e => updateAwnserValueCallback(uuid, h, e.target.value)} type="number" defaultValue={awnser_current_value} className="awnser-value"/>
                    </div>
                );
            })
        } else {
            return <h3>añade respuestas en el campo 'N.Respuestas'</h3>
        }
    }

    return(
        <div id={`question-editor-${uuid}`}  className="question-editor-container">
            <CNTinput default_value={data.title} on_blur={updateQuestionData} label_name={`pregunta ${uuid+1}`} uuid={null} placeholder="titulo de la pregunta..." cls="qe-title"/>
            <div className="ftr-qe-container">
                <div className="qe-possible-awnsers-contianer">
                    {getAwnsersView()}
                </div>
                <select onChange={updateQuestionData} className="qe-stat-measuerd">
                    {measures.map((itm, h) => {
                        if(itm !== "" && itm !== undefined) {
                            return <option key={`${uuid}-measure-${h}`} value={h}>{itm}</option>
                        }
                        return null
                    })}
                </select>
            </div>
        </div>
    );
}

const CNTinput = props => {

    

    const { 
        label_name, 
        uuid,
        placeholder,
        type,
        on_click,
        on_change,
        on_blur,
        on_keydown,
        default_value,
        minimal_value,
        has_errors,
        warning_msg
    } = props;
    
    const show_warning = has_errors === undefined ? false : has_errors;
    let class_name = props.cls !== undefined ? props.cls : "";
    class_name += show_warning ? " cnt-error" : ""

    return(
        <div id={uuid} className={`cnt-input ${class_name}`}>
            <h4 className="cnt-input-label">{label_name}</h4>
            <input 
                onBlur={on_blur}
                onChange={on_change} 
                onClick={on_click}
                onKeyDown={on_keydown}
                type={type !== undefined ? type : "text"} 
                placeholder={placeholder !== undefined ? placeholder : ""} 
                defaultValue={default_value}
                min={minimal_value}/>
            <span className="cnt-input-warning">{show_warning ? warning_msg : " "}</span>
        </div>
    )
}

export default NewTestCreator;