const isEmail = email => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)) return true;
    
    return false;
}

const isEmpty = string => {
    console.log(string);
    if(string.trim() === '') return true;
    
    return false;
}

const hasSpecialChars = string => /([^\w ]|[_0-9])/g.test(string);


const emptyError = 'must not be empty!';
const invalidEmailError = 'must be a valid email address!';
const hasSpecialCharsError = 'must not contain numbers or special characters!';

exports.validateLogin = form => {
    const { email, password } = form;

    let errors = {};
    !isEmail(email) && (errors.email = invalidEmailError);
    isEmpty(email) && (errors.email = emptyError);
    isEmpty(password) && (errors.password = emptyError);

    return {
        errors,
        isValid: Object.keys(errors).length > 0 ? false : true
    }
}

exports.validateSignup = form => {
    const { email, password, confirmPassword, firstname, lastname } = form;
    
    let errors = {};
    !isEmail(email) && (errors.email = invalidEmailError);
    isEmpty(email) && (errors.email = emptyError);
    isEmpty(password) && (errors.password = emptyError);
    password !== confirmPassword && (errors.confirmPassword = 'Passwords must match!');
    isEmpty(confirmPassword) && (errors.confirmPassword = emptyError);
    hasSpecialChars(firstname) && (errors.firstname = hasSpecialCharsError);
    isEmpty(firstname) && (errors.firstname = emptyError);
    hasSpecialChars(lastname) && (errors.lastname = hasSpecialCharsError);
    isEmpty(lastname) && (errors.lastname = emptyError);

    return {
        errors,
        isValid: Object.keys(errors).length > 0 ? false : true
    }
}