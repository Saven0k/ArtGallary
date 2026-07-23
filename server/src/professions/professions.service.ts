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
}