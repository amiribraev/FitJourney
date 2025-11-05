import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: "Требуется действительный адрес электронной почты" }),
  password: z.string().min(6, { message: "Пароль должен содержать не менее 6 символов" }),
});

export const RegistrationSchema = z.object({
  name: z.string().min(2, { message: "Имя должно содержать не менее 2 символов" }),
  email: z.string().email({ message: "Требуется действительный адрес электронной почты" }),
  password: z.string().min(6, { message: "Пароль должен содержать не менее 6 символов" }),
  age: z.coerce.number().min(14, { message: "Возраст должен быть не менее 14 лет" }).max(100, { message: "Возраст не должен превышать 100 лет" }),
  gender: z.enum(['male', 'female'], { required_error: "Пожалуйста, выберите пол" }),
  weight: z.coerce.number().min(30, { message: "Вес должен быть не менее 30 кг" }).max(300, { message: "Вес не должен превышать 300 кг" }),
  height: z.coerce.number().min(100, { message: "Рост должен быть не менее 100 см" }).max(250, { message: "Рост не должен превышать 250 см" }),
  goal: z.enum(['weight loss', 'muscle gain'], { required_error: "Пожалуйста, выберите цель" }),
});

export const ProfileUpdateSchema = RegistrationSchema.pick({
    weight: true,
    height: true,
    goal: true,
});

export type LoginData = z.infer<typeof LoginSchema>;
export type RegistrationData = z.infer<typeof RegistrationSchema>;
export type ProfileUpdateData = z.infer<typeof ProfileUpdateSchema>;
