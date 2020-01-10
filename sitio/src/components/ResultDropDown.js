import React from 'react';

const ResultDropDown = props => {

    let showing = false;
    const { test_results_data, test_name, test_num } = props;


    const removeShortName = full_name => {
        return full_name.split("(")[0]
    }

    let stats = []
    for(let stat_name of Object.keys(test_results_data))
    {
        stats.push(
        <div key={stat_name} className="rdd-stat">
            <p>{`${stat_name}: `}</p>
            <span>{test_results_data[stat_name]}</span>
        </div>)
    }



    const handleUserClick = () => {
        const dropdown = document.querySelector(`.rdd-attrib-container[test_num=${test_num}] .rdd-stats-container`);
        if(!showing)
        {
            dropdown.style.display = 'block';
        }
        else
        {
            dropdown.removeAttribute('style');
        }
        showing = !showing;
    }

    return(
        <div test_num={test_num} className="rdd-attrib-container">
            <div onClick={handleUserClick} className="rdd-title-container">
                <span className="test-name-title">{removeShortName(test_name)}</span>
            </div>
            <div className="rdd-stats-container">
                {stats}
            </div>
        </div>
    )

}

export default ResultDropDown;