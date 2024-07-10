// src/components/Register.js
import React, { useState } from 'react';
import RegisterEmail from './RegisterEmail';
import RegisterName from './RegisterName';
import RegisterPhone from './RegisterPhone';
import RegisterPassword from './RegisterPassword';

const Register = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const nextStep = (data1, data2) => {
    switch (step) {
      case 1:
        setEmail(data1);
        break;
      case 2:
        setName(data1);
        setLastName(data2);
        break;
      case 3:
        setPhone(data1);
        break;
      default:
        break;
    }
    setStep(step + 1);
  };

  switch (step) {
    case 1:
      return <RegisterEmail nextStep={nextStep} />;
    case 2:
      return <RegisterName nextStep={nextStep} />;
    case 3:
      return <RegisterPhone nextStep={nextStep} />;
    case 4:
      return <RegisterPassword email={email} name={name} lastName={lastName} phone={phone} />;
    default:
      return <div>Registro Completo</div>;
  }
};

export default Register;