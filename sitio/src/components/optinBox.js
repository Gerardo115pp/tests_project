import React from 'react';
import '../css/optionBox.css';

function optionBox(props)
{
    const {option_name,logo,not_img,onClick} = props;
    let content;
    if (not_img)
    {
        content = (
            <div onClick={onClick} className="option-box-container no-img">
                <div className="box-content no-img">
                    <h4 className="box-text no-img">{option_name}</h4>
                </div>
            </div>
        );
    }
    else
    {
        content = (
        <div onClick={onClick} className="option-box-container">
            <div className="box-content">
                <span className="box-logo">{logo}</span>
                <h4 className="box-text">{option_name}</h4>
            </div>                                                  
        </div>)
    }
    return(
        <React.Fragment>
            {content}
        </React.Fragment>
    );
}

export default optionBox;