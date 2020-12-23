import React from 'react';

class Test{
    constructor(test_json)
    {
        this.test_type = test_json.type;
        this.current_question = 1;
        this.answers = undefined;
        this.general = undefined;
        switch(this.test_type)
        {
            case 'A1':
                this.parseA1(test_json);
                break;
            case 'A3':
                this.parserA3(test_json);
                break;
            case 'B1':
                this.parseA1(test_json);
                break;
            case 'B2':
                this.parserB2(test_json);
                break;
            case 'C1':
                this.parseA1(test_json);
                break;
            case 'C2':
                this.parseA1(test_json);
                break;
            case 'D1':
                this.parseA1(test_json);
                break;
            default:
                console.log("no type attribute for this test")
                break;
        }
        this.length = Object.keys(this.questions).length;
        this.last_JSX = undefined;
    }

    /*----------  Parser Section  ----------*/
    

    parseA1 = test_json => {
        this.name = test_json.name.replace('\n','');
        this.questions = test_json.questions;
        this.answers = test_json.answers;
    }

    parserA3 = test_json => {
        this.name = Object.keys(test_json)[0];
        this.questions = test_json[this.name].questions;
    }

    parserB2 = test_json => {
        this.name = Object.keys(test_json)[0];
        this.general = (test_json[this.name].general !== undefined) ? test_json[this.name].general : '';
        this.questions = test_json[this.name].questions; 
        // console.log(JSON.stringify(test_json));
    }

    
    /*----------  Rendering Functions  ----------*/
    
    getQuestionTitle = title => {
        if(this.general !== undefined && this.general !== '')
        {   
            return(
                <React.Fragment>
                    <span>{this.general}:</span>
                    <br/>
                    <br/>
                    <span>> {title}</span>
                </React.Fragment>
            );
        }
        return title;
    }

    getAnswersJsxList = (question_code, callback) => {
        let answers_list = this.getAnswersKeys();
        let answer_value;
        let jsx_list = [];
        let key = 0;
        for(let answer of answers_list)
        {
            answer_value = (Array.isArray(this.questions[question_code].values)) ? this.questions[question_code].values[key] : this.questions[question_code].values[answer];
            jsx_list.push(
                <div valor={answer_value} key={key} onClick={callback} className="awnser-text-container">
                    <h4 className="anwser-text">{answer}</h4>
                </div>
            )
            key++;
        }
        return jsx_list;
    }

    getRangeAnswer = (question_code,callback) => {
        const answers_list = this.getAnswersKeys();
        
        let range_h4s = [];
        for(let h=0;h<answers_list.length;h++)
        {
            range_h4s.push(
                <h4 className='range-answer-text' key={h}>{answers_list[h]}</h4>
            )
        }
        const h4s_container = <div id="range-answer-text-container">{range_h4s}</div>;

        let range_values = this.questions[question_code].values;
        let inputs = []
        let key = 0;
        for(let valor of range_values)
        {
            inputs.push(<input onClick={callback} className='range-anwser-input' name='answer-value' type="radio" key={key} value={valor}/>);
            key++;
        }

        const answer_jsx = (
            <div id="range-answer-container">
                {h4s_container}
                <div id="answer-inputs-container">
                    {inputs}
                </div>
            </div>
        )
        return answer_jsx;

    }

    getTestJsx = (question_num,answerClickedCallback) => {
        if (question_num>0 && question_num <= this.length )
        {
            this.current_question = question_num;
            const question_code = (this.questions.hasOwnProperty(`P${question_num}`)) ? `P${question_num}` : `p${question_num}`;
            let jsx_list;
            console.log(question_code); 
            let question_title = this.getQuestionTitle(this.questions[question_code].text);
            let test_jsx;
            if(!(this.test_type==='C1'||this.test_type==='C2'))
            {
                 jsx_list = this.getAnswersJsxList(question_code,answerClickedCallback);
            }
            else
            {
                jsx_list = this.getRangeAnswer(question_code,answerClickedCallback);
            }
            
            test_jsx = (
                <div id="a1-test-container" mide={this.questions[question_code].mide} question_num={question_num}>
                    <div id="title-questionary-container">
                        <h1 id="questionary-title">{this.name}</h1>
                    </div>
                    <div id="a1-question-container">
                        <h3 className="question-text">{question_title}</h3>
                        <span id='questions-counter'>Pregunta ({question_num}/{this.length})</span>
                    </div>
                    <div id="awnsers-container">
                        {jsx_list}
                    </div>
                </div>
            );
            this.last_JSX = test_jsx;
            return test_jsx;
        
        }
        else
        {
            return null;
        }
    }

    getAnswersKeys = () => {
        if(this.answers!==undefined)
        {
            return this.answers
        }
        let question_code = `P${this.current_question}`;
        return Object.keys(this.questions[question_code].values);
    }

    showData = () => {
        console.log(`tipo: ${this.test_type}\nnombre: ${this.name}\nanswers: ${this.getAnswersKeys()}`);
    }
}

export default Test;