// src/cart-history/cart-history.module.ts
import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { CartHistory } from "./cart-history.model";
import { CartHistoryService } from "./cart-history.service";
import { CartHistoryController } from "./cart-history.controller";
import { Cart } from "../cart/cart.model";
import { User } from "../users/users.model";

@Module({
    controllers: [CartHistoryController],
    providers: [CartHistoryService],
    imports: [SequelizeModule.forFeature([CartHistory, Cart, User])],
    exports: [CartHistoryService],
})
export class CartHistoryModule {}