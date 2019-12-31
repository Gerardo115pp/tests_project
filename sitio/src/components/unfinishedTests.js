import React from 'react';
import '../css/unfinishedTests.css';

const unfinishedTests = props => {
    const { uts, hiddingCallback } = props;

    const createShortName = raw_names => {
        /**
         * ensures that the name of the option component is not to long 
         */
        let short_name = "";
        for(let h=0; h < raw_names.length; h++)
        {
            short_name += raw_names[h]
            short_name += (short_name.length <= 13 && (h+1) < raw_names.length) ? ", " : "..." 
            if(short_name.length >= 15) 
            {
                break;
            }
        }

        return short_name;
    }

    const content = [];
    let ut_num = 0;

    uts.forEach(ut => { // Create the list of uts
        content.push((
            <div className='ut-option-container' key={ut_num} ut_num={ut_num} onClick= {e => {
                const elemenet = e.currentTarget;
                return props.callback(parseInt(elemenet.getAttribute('ut_num')));
            }}>
                {`${ut.interviewee_name.toUpperCase()} (${createShortName(ut['tests_names'])})`}
            </div>
        ))
    });

    return(
        <div id="select-ut-modalbackground">
            <div id="select-ut-container">
                <div id="select-ut-title-container">
                    <h2>Entrevistas sin terminar</h2>
                </div>
                <div id="uts-container">
                    {content}
                </div>
                <div id="select-uts-controls">
                    <i onClick={hiddingCallback} className="fas fa-chevron-up"></i>
                </div>
            </div>
        </div>
    );
}


export default unfinishedTests;