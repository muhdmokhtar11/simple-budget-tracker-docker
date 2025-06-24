package com.mycompany.myapp.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class ExpenseTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static Expense getExpenseSample1() {
        return new Expense().id(1L).description("description1");
    }

    public static Expense getExpenseSample2() {
        return new Expense().id(2L).description("description2");
    }

    public static Expense getExpenseRandomSampleGenerator() {
        return new Expense().id(longCount.incrementAndGet()).description(UUID.randomUUID().toString());
    }
}
