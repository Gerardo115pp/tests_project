import React from 'react';
import {Router, Route, Switch} from 'react-router-dom';
import LoginPage from './components/pages/login';
import MainMenu from './components/pages/MainMenu';
import TestMenu from './components/pages/TestsMenu';
import Interviews from './components/pages/Interviews';
import Results from './components/pages/Results';
import TokenUserEnd from './components/pages/TokenUserEnd';
import Historial from './components/historial';
import './css/App.css';

function App() {
  return (
    <Router history={Historial}>
      <Switch>
        <Route exact path='/' component={LoginPage}/>
        <Route exact path='/main-menu' component={MainMenu}/>
        <Route exact path='/test-menu' component={TestMenu}/>
        <Route exact path='/interviews' component={Interviews}/>
        <Route exact path='/results' component={Results}/>
        <Route exact path='/interview-done' component={TokenUserEnd}/>
      </Switch>
    </Router>
  );
}

export default App;
