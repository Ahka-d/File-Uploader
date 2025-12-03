const handleCustomError = (err, res) => {
  err.stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;
  res.render('./errors/error', {error: err});
};

const handleGenericError = (res) => {
  const genericError = new Error('Algo salió mal.');
  genericError.statusCode = 500;
  genericError.status = 'error';
  res.render('./errors/error', {error: genericError});
};

const handleValidationError = (err, res) => {
  err.stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;
  res.render('sign-up-form', {error: err});
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if(err.validationError){
    return handleValidationError(err, res);
  }
  if (err.isOperational) {
    handleCustomError(err, res);
  } else {
    console.error('ERROR 💥', err);
    handleGenericError(res);
  }
};