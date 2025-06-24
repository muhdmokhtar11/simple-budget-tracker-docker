package com.mycompany.myapp.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class IncomeTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static Income getIncomeSample1() {
        return new Income().id(1L).description("description1");
    }

    public static Income getIncomeSample2() {
        return new Income().id(2L).description("description2");
    }

    public static Income getIncomeRandomSampleGenerator() {
        return new Income().id(longCount.incrementAndGet()).description(UUID.randomUUID().toString());
    }
}
