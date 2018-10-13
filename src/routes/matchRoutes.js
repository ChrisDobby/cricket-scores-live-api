export default (app, db) => {
    const handleError = (err, req, res) => {
        if (err.message === 'notfound') {
            res.status(404);
            res.send(`match with id ${req.params.id} not found`);
        } else {
            res.status(500);
        }
    };

    app.get('/match/:id', (req, res) => {
        db.get(req.params.id, (err, result) => {
            if (typeof err !== 'undefined') {
                handleError(err, req, res);
            } else {
                res.send(result);
            }
        });
    });

    app.get('/match', (req, res) => {
        db.getAll((err, result) => {
            res.send(result);
        });
    });

    app.post('/match', (req, res) => {
        db.add(req.body, (err, result) => {
            res.send(result);
        });
    });

    app.put('/match', (req, res) => {
        db.update(req.body, (err, result) => {
            if (typeof err !== 'undefined') {
                handleError(err, req, res);
            } else {
                res.send(result);
            }
        });
    });
};