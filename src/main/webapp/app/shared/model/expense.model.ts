import dayjs from 'dayjs';
import { ICategory } from 'app/shared/model/category.model';
import { IUser } from 'app/shared/model/user.model';

export interface IExpense {
  id?: number;
  amount?: number;
  description?: string | null;
  date?: dayjs.Dayjs;
  category?: ICategory;
  user?: IUser | null;
}

export const defaultValue: Readonly<IExpense> = {};
