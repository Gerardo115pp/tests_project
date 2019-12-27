import React, { Component } from 'react';
import * as resultsActions from '../actions/resultsActions';
import { connect } from 'react-redux';

class ResultBox extends Component
{
    
    showResults = () => {
        const { results, name } = this.props.interview;
        const sidebar = document.getElementById('results-side-bar');

        this.props.setResults(results,name);
        sidebar.style.width = "30%";
    }

    render()
    {
        const { interview, id } = this.props;
        return(
            <div className='interview-results-container' onClick={this.showResults}>
            <div className="interviewee-name-container">
                <h4 className="interviewee-name-text">{interview['name']}</h4>
                <div className='controls-container'>
                    <i onClick={() => {this.props.callback(id)}} className="cross fas fa-times-circle"></i>
                </div>
            </div>
        </div>
        );
    }
}

const mapStateToProps = reducers => {
    return {
        results: reducers.resultsReducer
    }
}

export default connect(mapStateToProps,resultsActions)(ResultBox);