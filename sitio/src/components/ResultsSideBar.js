import React, { Component } from 'react';
import ResultDropDown from './ResultDropDown';
import { connect } from 'react-redux';
import * as resultsActions from '../actions/resultsActions';

class ResultsSideBar extends Component{

    setSpaces = string => {
        return string.split("_").join(" ");
    }

    hideSideBar = () => {
        const element = document.getElementById('results-side-bar');
        element.style.width = "0"
    }

    render(){
        const { results, title_name, profile, test_dictionary } = this.props.results;
        let results_array = []; 
        if(results !== null)
        {
            const results_attribs = Object.keys(results);
            for(let h = 0; h < results_attribs.length; h++){
                results_array.push(
                    <ResultDropDown key={h} profile_data={profile["values"][test_dictionary[results_attribs[h]]]} test_num={`test_${h}`} test_name={results_attribs[h]} test_results_data={results[results_attribs[h]]} />
                )
            }
        }
        return(
            <div id="results-side-bar">
                <div id="results-side-bar-title">
                    <span className="results-title-text">{title_name}</span>
                    <div id="sidebar-controls">
                        <span id="close-sidebar-btn" onClick={this.hideSideBar}><i className="fas fa-times"></i></span>
                    </div>
                </div>
                <div id="results-stats-container">
                    {results_array}
                </div>
            </div>
        )
    }
}

const mapStateToProps = reducers => {
    return{
        results: reducers.resultsReducer
    }
}

export default connect(mapStateToProps, resultsActions)(ResultsSideBar);
