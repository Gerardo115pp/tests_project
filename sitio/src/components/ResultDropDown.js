import React from 'react';

const ResultDropDown = props => {

    let showing = false;
    const { test_results_data, test_name, test_num } = props;


    const removeShortName = full_name => {
        return full_name.split("(")[0]
    }

    const getResultColorClass = (stat, value) => {
        if (/^\d+$/.test(value))
        {
            const { profile_data } = props;
            value = parseInt(value);
            const expected_value = profile_data[stat].VE,
                  standar_diviation = profile_data[stat].DE;
            
            if (value < (expected_value - standar_diviation) || value > (expected_value + standar_diviation))
            {
                return "danger";
            }
            else if(value < (expected_value - (standar_diviation - (standar_diviation * 0.7))) || value > (expected_value + (standar_diviation - (standar_diviation * 0.7))))
            {
                return "warning";
            }                  
            else
            {
                return "perfect-fit";
            }

        }
    }

    let stats = []
    for(let stat_name of Object.keys(test_results_data))
    {

        stats.push(
        <div key={stat_name} className="rdd-stat">
            <p>{`${stat_name}: `}</p>
            <span className={getResultColorClass(stat_name, test_results_data[stat_name])}> {`  ${test_results_data[stat_name]}`}</span>
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