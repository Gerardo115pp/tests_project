import React, { Component } from 'react';
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
        const { results, title_name } = this.props.results;
        let results_array = []; 
        if(results !== null)
        {
            const results_attribs = Object.keys(results);
            for(let h = 0; h < results_attribs.length; h++){
                results_array.push(
                    <div key={h} className="results-attrib-container">
                        <span className="attrib-text">{`${this.setSpaces(results_attribs[h])}: `}<span className="attrib-text-num">{`${results[results_attribs[h]]}`}</span></span>
                    </div>
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
