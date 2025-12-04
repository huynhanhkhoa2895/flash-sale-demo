// Order Entity - Database representation of orders

import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { OrderStatus } from "shared-types";

@Entity("orders")
export class OrderEntity {
  @PrimaryColumn("varchar", { length: 255 })
  id: string;

  @Column("varchar", { length: 255 })
  userId: string;

  @Column("varchar", { length: 255 })
  productId: string;

  @Column("integer")
  quantity: number;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column("text", { nullable: true })
  reason?: string;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;
}
