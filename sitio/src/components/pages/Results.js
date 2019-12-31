import React, { Component } from 'react';
import { connect } from 'react-redux';
import ResultBox from '../ResultBox';
import ResultsSideBar from '../ResultsSideBar';
import historial from '../historial';
import * as userActions from '../../actions/userActions';
import * as serverInfo from '../../serverInfo';
import '../../css/Results.css';

class Results extends Component
{
    state = {
        interviews: {}
    }

    checkResponse = interviews => {
        for(let interviewee_key of Object.keys(interviews))
        {
            if(interviews[interviewee_key].results === null)
            {
                this.deleteResultFromDB(interviewee_key);
                delete interviews[interviewee_key];
            }
        }
        return interviews;
    }

    componentWillMount() 
    {
        const { user_id } = this.props;
        const forma = new FormData();
        forma.append('id',user_id);

        const request = new Request(`${serverInfo.server_name}getInterviews`,{method: 'POST',body:forma});
        fetch(request)
            .then(promise => promise.json())
            .then(response => {
                if(Object.keys(response.interviews).length > 0)
                {
                    const interviews = this.checkResponse(response.interviews);
                    this.setState({
                        interviews: interviews
                    })
                }
                else
                {
                    console.log("no results gotten");
                }
            })
    }

    deleteResultFromDB = id => {
        const forma = new FormData();
        forma.append('id',id);

        const request = new Request(`${serverInfo.server_name}deleteInterviewee`,{method: 'POST',body: forma});
        fetch(request);
    }

    deleteResult = (id, interviewee_key) => {
        let { interviews } = this.state;
        delete interviews[id];
        this.setState({
            interviews: interviews
        })
        this.deleteResultFromDB(interviewee_key);
    }   

    renderResultsAsJsx = () => {
        const results_array = [];
        const { interviews } = this.state;
        if(Object.keys(interviews).length > 0)
        {
            let h = 0;
            for(let interview_key of Object.keys(interviews))
            {
                results_array.push(<ResultBox key={h} id={interview_key} callback={this.deleteResult} interview={interviews[interview_key]}/>)
                h++;
            }
        }
        return results_array;
    }

    render(){
        const interviews_jsx = this.renderResultsAsJsx();
        return(
            <React.Fragment>
                <ResultsSideBar />
                <header id="results-header">
                    <div id="title-container">
                        <h1 className="page-title">Resultados</h1>
                    </div>
                    <span id='back-arrow' className="white-element" onClick={() => {historial.push('/main-menu')}}>
                        <i className="fas fa-arrow-left"></i>
                    </span>
                </header>
                <div id="results-area">{interviews_jsx}</div>
            </React.Fragment>
        )
    }
}

const mapStateToProps = reducers => {
    return reducers.userReducer;
}

export default connect(mapStateToProps,userActions)(Results);
