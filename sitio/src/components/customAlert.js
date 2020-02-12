import React from 'react';
import '../css/customAlert.css';

const CustomAlert = props => {
    const { alert_message } = props;

    const alert_jsx = (
        <div id="alert-container" className={`${alert_message.length > 0 ? "alert" : "hidden-alert"}`}>
            <div className="alert-messege">{alert_message}</div>
            <div onClick={() => {document.getElementById('alert-container').style.visibility = 'hidden';}} className="alert-closing-btn"><i className="far fa-times-circle"></i></div>
        </div>
    )

    return alert_jsx;
}

export default CustomAlert;