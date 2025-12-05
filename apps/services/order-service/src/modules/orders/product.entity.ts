// Product Entity - For reading product information

import { Entity, Column, PrimaryColumn, CreateDateColumn } from "typeorm";

@Entity("products")
export class ProductEntity {
  @PrimaryColumn("varchar", { length: 255 })
  id: string;

  @Column("varchar", { length: 255 })
  name: string;

  @Column("text", { nullable: true })
  description?: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column("integer")
  initialStock: number;

  @Column("integer")
  currentStock: number;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;
}

