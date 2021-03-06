import jwtDecode from 'jwt-decode';
import profanityFilter from '../middleware/profanityFilter';

export default (app, db, checkJwt, updates) => {
    const handleError = (err, req, res) => {
        if (err.message && err.message === 'notfound') {
            res.status(404);
            res.send(`match with id ${req.params.id} not found`);
        } else {
            res.sendStatus(500);
        }
    };

    const getUser = req => jwtDecode(req.headers.authorization.split(' ')[1]).sub;

    const checkUser = (user, match) => match && user === match.user;

    app.get('/match/:id', (req, res) => {
        db.get(req.params.id)
            .then(result => res.send(result))
            .catch(err => handleError(err, req, res));
    });

    app.get('/match', (req, res) => {
        db.getAll(req.query)
            .then(result =>
                res.send(
                    result.map(item => ({
                        id: item.id,
                        date: item.match.date,
                        user: item.match.user,
                        homeTeam: item.match.homeTeam.name,
                        awayTeam: item.match.awayTeam.name,
                        status: item.match.status,
                        version: item.version || 0,
                        lastEvent: item.lastEvent,
                    })),
                ),
            )
            .catch(err => handleError(err, req, res));
    });

    app.post('/match', checkJwt, profanityFilter, (req, res) => {
        const user = getUser(req);
        db.add(req.body, user)
            .then(result => {
                db.recordUserTeams(user, [req.body.match.homeTeam, req.body.match.awayTeam]);
                res.send(result);
                updates.matchAdded(result);
            })
            .catch(err => handleError(err, req, res));
    });

    app.put('/match/:id', checkJwt, profanityFilter, (req, res) => {
        db.get(req.params.id)
            .then(getResult => {
                if (!checkUser(getUser(req), getResult.match)) {
                    res.sendStatus(401);
                } else {
                    db.update(req.params.id, req.body);
                    updates.matchUpdated(req.body);
                }
            })
            .then(result => res.send(result))
            .catch(err => handleError(err, req, res));
    });

    app.delete('/match/:id', checkJwt, (req, res) => {
        db.get(req.params.id)
            .then(result => {
                if (!checkUser(getUser(req), result.match)) {
                    res.sendStatus(401);
                } else {
                    db.remove(req.params.id);
                }
            })
            .then(() => res.sendStatus(204))
            .catch(err => handleError(err, req, res));
    });
};
