import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Profession } from './profession.model';
import { CreateProfessionDto } from './dto/create-profession.dto';
import { UpdateProfessionDto } from './dto/update-profession.dto';

@Injectable()
export class ProfessionsService {
    constructor(
        @InjectModel(Profession) private professionRepository: typeof Profession,
    ) { }

    async create(dto: CreateProfessionDto): Promise<Profession> {
        const existing = await this.professionRepository.findOne({ where: { name: dto.name } });
        if (existing) throw new HttpException('Профессия с таким названием уже существует', HttpStatus.CONFLICT);
        return this.professionRepository.create(dto);
    }

    async update(id: number, dto: UpdateProfessionDto): Promise<Profession> {
        const profession = await this.professionRepository.findByPk(id);
        if (!profession) throw new HttpException('Профессия не найдена', HttpStatus.NOT_FOUND);
        await this.professionRepository.update(dto, { where: { id }, });
        const updated = await this.professionRepository.findByPk(id);
        return updated;
    }

    async delete(id: number): Promise<{ success: boolean; message: string }> {
        const deletedCount = await this.professionRepository.destroy({ where: { id } });
        if (deletedCount === 0) throw new HttpException('Профессия не найдена', HttpStatus.NOT_FOUND);
        return { success: true, message: 'Профессия успешно удалена' };
    }

    async getAll(): Promise<Profession[]> { return this.professionRepository.findAll({ order: [['name', 'ASC']] }); }


    async getById(id: number): Promise<Profession> {
        const profession = await this.professionRepository.findByPk(id);
        if (!profession) throw new HttpException('Профессия не найдена', HttpStatus.NOT_FOUND);
        return profession;
    }

    async seedProfessions(): Promise<{ success: boolean; message: string; created: number }> {
        const defaultProfessions: CreateProfessionDto[] = [
            {
                name: 'Художник',
                description: 'Создает произведения изобразительного искусства (живопись, графика)'
            },
            {
                name: 'Скульптор',
                description: 'Создает трехмерные произведения искусства из различных материалов'
            },
            {
                name: 'Фотограф',
                description: 'Создает художественные и документальные фотографии'
            },
            {
                name: 'Графический дизайнер',
                description: 'Разрабатывает визуальные концепции и дизайн для различных медиа'
            },
            {
                name: 'Иллюстратор',
                description: 'Создает иллюстрации для книг, журналов, рекламы и цифровых проектов'
            },
            {
                name: 'Архитектор',
                description: 'Проектирует здания и сооружения с учетом эстетики и функциональности'
            },
            {
                name: 'Музыкант',
                description: 'Исполняет и создает музыкальные произведения'
            },
            {
                name: 'Танцор',
                description: 'Выражает художественные идеи через движение и хореографию'
            },
            {
                name: 'Актер',
                description: 'Исполняет роли в театре, кино и на телевидении'
            },
            {
                name: 'Режиссер',
                description: 'Руководит творческим процессом создания фильмов, спектаклей или других проектов'
            },
            {
                name: 'Кинооператор',
                description: 'Отвечает за визуальное воплощение замысла режиссера в кино и на ТВ'
            },
            {
                name: 'Художник по костюмам',
                description: 'Создает костюмы для театральных и кинопостановок'
            },
        ];

        let createdCount = 0;

        for (const professionDto of defaultProfessions) {
            try {
                const existing = await this.professionRepository.findOne({
                    where: { name: professionDto.name }
                });

                if (!existing) {
                    await this.professionRepository.create(professionDto);
                    createdCount++;
                }
            } catch (error: any) {
                console.error(`Ошибка при создании профессии "${professionDto.name}":`, error.message);
            }
        }

        return {
            success: true,
            message: `Успешно добавлено ${createdCount} профессий из ${defaultProfessions.length}`,
            created: createdCount,
        };
    }
}