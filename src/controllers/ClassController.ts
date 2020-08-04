import db from '../database/connection';
import convertTimeToMinutes from '../utils/convertTimeToMinutes';
import { Request as ExpressRequest, Response } from 'express';

interface schedule {
    week_day: number;
    from: string;
    to: string;
}

interface Request {
    query: {
        week_day: number;
        subject: string;
        time: string;
    }
}

class ClassController {
    async index(req: Request, res: Response) {
        const { week_day, subject, time } = req.query;

        if (!week_day || !subject || !time)
            return res.status(400).json({ error: "Filtros não enviados!" });

        const timeInMinutes = convertTimeToMinutes(time);

        const classes = await db('classes')
            .whereExists(function () {
                this.select('class_schedule.*')
                    .from('class_schedule')
                    .whereRaw('`class_schedule`.`class_id` = `classes`.`id`')
                    .whereRaw('`class_schedule`.`week_day` = ??', [Number(week_day)])
                    .whereRaw('`class_schedule`.`from` <= ??', [Number(timeInMinutes)])
                    .whereRaw('`class_schedule`.`to` > ??', [Number(timeInMinutes)])
            })
            .where('classes.subject', '=', subject)
            .join('users', 'classes.user_id', '=', 'users.id');

        return res.status(201).json(classes);

    }

    async store(req: ExpressRequest, res: Response) {

        const trx = await db.transaction();

        const {
            name,
            avatar,
            bio,
            subject,
            whatsapp,
            cost,
            schedule: unformattedSchedule
        } = req.body;

        try {
            const [user_id] = await trx('users').insert({
                name,
                avatar,
                bio,
                whatsapp
            });

            const [class_id] = await trx('classes').insert({
                subject,
                cost,
                user_id
            });

            const schedule = unformattedSchedule.map((schedule: schedule) => {
                return {
                    ...schedule,
                    class_id,
                    from: convertTimeToMinutes(schedule.from),
                    to: convertTimeToMinutes(schedule.to)
                }
            });

            await trx('class_schedule').insert(schedule);

            await trx.commit();
        } catch (error) {
            await trx.rollback();
            return res.status(400).json(error);
        }

        return res.status(201).send();
    }
}

export default new ClassController();