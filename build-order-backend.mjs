import fs from 'fs'
import path from 'path'

const backendRoot = "D:/1.B'Groceries/Backend/B-Backend/src/main/java/com/bgroceries/backend"

// --------------------------------------------------------------------------
// 1. SALE ORDER
// --------------------------------------------------------------------------
const saleOrderEntity = `package com.bgroceries.backend.entity.Sale;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sale_order")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", length = 60, nullable = false, unique = true)
    private String code;

    @Column(name = "quote_code", length = 60)
    private String quoteCode;

    @Column(name = "po_code", length = 60)
    private String poCode;

    @Column(name = "order_date", nullable = false)
    private LocalDateTime orderDate;

    @Column(name = "delivery_date")
    private LocalDateTime deliveryDate;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "customer_name", length = 200)
    private String customerName;

    @Column(name = "customer_phone", length = 60)
    private String customerPhone;

    @Column(name = "salesperson", length = 100)
    private String salesperson;

    @Column(name = "payment_term", length = 100)
    private String paymentTerm;

    @Column(name = "outlet", length = 100)
    private String outlet;

    @Column(name = "template_name", length = 100)
    private String templateName;

    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private String status = "CONFIRMED"; // DRAFT, CONFIRMED, PROCESSING, BILLED, CANCELLED

    @Column(name = "credit_limit", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal creditLimit = BigDecimal.ZERO;

    @Column(name = "available_credit", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal availableCredit = BigDecimal.ZERO;

    @Column(name = "sub_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal subAmount = BigDecimal.ZERO;

    @Column(name = "discount_percent", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal discountPercent = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "markup_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal markupAmount = BigDecimal.ZERO;

    @Column(name = "grand_total", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal grandTotal = BigDecimal.ZERO;

    @Column(name = "balance", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "reference", length = 100)
    private String reference;

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "related_purchase_order", length = 100)
    private String relatedPurchaseOrder;

    @OneToMany(mappedBy = "saleOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<SaleOrderItem> items = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.orderDate == null) this.orderDate = LocalDateTime.now();
        if (this.status == null) this.status = "CONFIRMED";
        if (this.subAmount == null) this.subAmount = BigDecimal.ZERO;
        if (this.grandTotal == null) this.grandTotal = BigDecimal.ZERO;
        if (this.balance == null) this.balance = this.grandTotal;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
`

const saleOrderItemEntity = `package com.bgroceries.backend.entity.Sale;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "sale_order_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleOrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_order_id", nullable = false)
    @JsonBackReference
    private SaleOrder saleOrder;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "product_code", length = 60)
    private String productCode;

    @Column(name = "barcode", length = 60)
    private String barcode;

    @Column(name = "description", length = 255, nullable = false)
    private String description;

    @Column(name = "qty", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal qty = BigDecimal.ONE;

    @Column(name = "price", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "discount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "uom", length = 50)
    @Builder.Default
    private String uom = "PCS";

    @Column(name = "total", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal total = BigDecimal.ZERO;
}
`

const saleOrderDto = `package com.bgroceries.backend.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleOrderDto {
    private Long id;
    private String code;
    private String quoteCode;
    private String poCode;
    private LocalDateTime orderDate;
    private LocalDateTime deliveryDate;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String salesperson;
    private String paymentTerm;
    private String outlet;
    private String templateName;
    private String status;
    private BigDecimal creditLimit;
    private BigDecimal availableCredit;
    private BigDecimal subAmount;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal markupAmount;
    private BigDecimal grandTotal;
    private BigDecimal balance;
    private String reference;
    private String username;
    private String note;
    private String relatedPurchaseOrder;
    @Builder.Default
    private List<SaleOrderItemDto> items = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
`

const saleOrderItemDto = `package com.bgroceries.backend.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleOrderItemDto {
    private Long id;
    private Long productId;
    private String productCode;
    private String barcode;
    private String description;
    private BigDecimal qty;
    private BigDecimal price;
    private BigDecimal discount;
    private String uom;
    private BigDecimal total;
}
`

const saleOrderRepo = `package com.bgroceries.backend.repository;

import com.bgroceries.backend.entity.Sale.SaleOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleOrderRepository extends JpaRepository<SaleOrder, Long> {
    Optional<SaleOrder> findByCode(String code);

    @Query("SELECT s FROM SaleOrder s WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(s.code) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.quoteCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.poCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.customerPhone) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.salesperson) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR :status = '' OR :status = 'ALL' OR s.status = :status) AND " +
           "(:outlet IS NULL OR :outlet = '' OR :outlet = 'ALL' OR s.outlet = :outlet) AND " +
           "(:startDate IS NULL OR s.orderDate >= :startDate) AND " +
           "(:endDate IS NULL OR s.orderDate <= :endDate) " +
           "ORDER BY s.createdAt DESC")
    List<SaleOrder> searchSaleOrders(
            @Param("search") String search,
            @Param("status") String status,
            @Param("outlet") String outlet,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    List<SaleOrder> findTop50ByOrderByCreatedAtDesc();
}
`

const saleOrderService = `package com.bgroceries.backend.service;

import com.bgroceries.backend.dto.SaleOrderDto;
import java.time.LocalDateTime;
import java.util.List;

public interface SaleOrderService {
    List<SaleOrderDto> getAllSaleOrders(String search, String searchBy, String status, String outlet, LocalDateTime startDate, LocalDateTime endDate);
    SaleOrderDto getSaleOrderById(Long id);
    SaleOrderDto createSaleOrder(SaleOrderDto dto);
    SaleOrderDto updateSaleOrder(Long id, SaleOrderDto dto);
    void deleteSaleOrder(Long id);
    String generateNextCode();
}
`

const saleOrderServiceImpl = `package com.bgroceries.backend.service.impl;

import com.bgroceries.backend.dto.SaleOrderDto;
import com.bgroceries.backend.dto.SaleOrderItemDto;
import com.bgroceries.backend.entity.Sale.SaleOrder;
import com.bgroceries.backend.entity.Sale.SaleOrderItem;
import com.bgroceries.backend.repository.SaleOrderRepository;
import com.bgroceries.backend.service.SaleOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaleOrderServiceImpl implements SaleOrderService {
    private final SaleOrderRepository saleOrderRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SaleOrderDto> getAllSaleOrders(String search, String searchBy, String status, String outlet, LocalDateTime startDate, LocalDateTime endDate) {
        List<SaleOrder> list;
        if ((search != null && !search.isBlank()) || (status != null && !status.equalsIgnoreCase("ALL")) || (outlet != null && !outlet.equalsIgnoreCase("ALL")) || startDate != null || endDate != null) {
            list = saleOrderRepository.searchSaleOrders(search, status, outlet, startDate, endDate);
        } else {
            list = saleOrderRepository.findTop50ByOrderByCreatedAtDesc();
        }
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SaleOrderDto getSaleOrderById(Long id) {
        return toDto(saleOrderRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Sale Order not found: " + id)));
    }

    @Override
    @Transactional
    public SaleOrderDto createSaleOrder(SaleOrderDto dto) {
        if (dto.getCode() == null || dto.getCode().isBlank() || dto.getCode().equalsIgnoreCase("AUTO")) {
            dto.setCode(generateNextCode());
        }
        SaleOrder entity = toEntity(dto);
        return toDto(saleOrderRepository.save(entity));
    }

    @Override
    @Transactional
    public SaleOrderDto updateSaleOrder(Long id, SaleOrderDto dto) {
        SaleOrder existing = saleOrderRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Sale Order not found: " + id));
        existing.setQuoteCode(dto.getQuoteCode());
        existing.setPoCode(dto.getPoCode());
        existing.setDeliveryDate(dto.getDeliveryDate());
        existing.setCustomerName(dto.getCustomerName());
        existing.setCustomerPhone(dto.getCustomerPhone());
        existing.setSalesperson(dto.getSalesperson());
        existing.setPaymentTerm(dto.getPaymentTerm());
        existing.setOutlet(dto.getOutlet());
        existing.setStatus(dto.getStatus() != null ? dto.getStatus() : existing.getStatus());
        existing.setGrandTotal(dto.getGrandTotal() != null ? dto.getGrandTotal() : BigDecimal.ZERO);
        existing.setBalance(dto.getBalance() != null ? dto.getBalance() : BigDecimal.ZERO);
        existing.setMarkupAmount(dto.getMarkupAmount() != null ? dto.getMarkupAmount() : BigDecimal.ZERO);
        existing.setReference(dto.getReference());
        existing.setUsername(dto.getUsername());
        existing.setNote(dto.getNote());

        if (dto.getItems() != null) {
            existing.getItems().clear();
            for (SaleOrderItemDto it : dto.getItems()) {
                existing.getItems().add(SaleOrderItem.builder()
                        .saleOrder(existing)
                        .productId(it.getProductId())
                        .productCode(it.getProductCode())
                        .barcode(it.getBarcode())
                        .description(it.getDescription())
                        .qty(it.getQty() != null ? it.getQty() : BigDecimal.ONE)
                        .price(it.getPrice() != null ? it.getPrice() : BigDecimal.ZERO)
                        .discount(it.getDiscount() != null ? it.getDiscount() : BigDecimal.ZERO)
                        .uom(it.getUom() != null ? it.getUom() : "PCS")
                        .total(it.getTotal() != null ? it.getTotal() : BigDecimal.ZERO)
                        .build());
            }
        }
        return toDto(saleOrderRepository.save(existing));
    }

    @Override
    @Transactional
    public void deleteSaleOrder(Long id) {
        saleOrderRepository.deleteById(id);
    }

    @Override
    public String generateNextCode() {
        return "SO-" + DateTimeFormatter.ofPattern("yyyyMM").format(LocalDateTime.now()) + "-" + String.format("%04d", saleOrderRepository.count() + 1);
    }

    private SaleOrderDto toDto(SaleOrder entity) {
        List<SaleOrderItemDto> itemDtos = entity.getItems() != null
                ? entity.getItems().stream().map(i -> SaleOrderItemDto.builder()
                .id(i.getId()).productId(i.getProductId()).productCode(i.getProductCode()).barcode(i.getBarcode()).description(i.getDescription()).qty(i.getQty()).price(i.getPrice()).discount(i.getDiscount()).uom(i.getUom()).total(i.getTotal()).build()).collect(Collectors.toList())
                : new ArrayList<>();

        return SaleOrderDto.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .quoteCode(entity.getQuoteCode())
                .poCode(entity.getPoCode())
                .orderDate(entity.getOrderDate())
                .deliveryDate(entity.getDeliveryDate())
                .customerId(entity.getCustomerId())
                .customerName(entity.getCustomerName())
                .customerPhone(entity.getCustomerPhone())
                .salesperson(entity.getSalesperson())
                .paymentTerm(entity.getPaymentTerm())
                .outlet(entity.getOutlet())
                .templateName(entity.getTemplateName())
                .status(entity.getStatus())
                .creditLimit(entity.getCreditLimit())
                .availableCredit(entity.getAvailableCredit())
                .subAmount(entity.getSubAmount())
                .discountPercent(entity.getDiscountPercent())
                .discountAmount(entity.getDiscountAmount())
                .taxAmount(entity.getTaxAmount())
                .markupAmount(entity.getMarkupAmount())
                .grandTotal(entity.getGrandTotal())
                .balance(entity.getBalance())
                .reference(entity.getReference())
                .username(entity.getUsername())
                .note(entity.getNote())
                .relatedPurchaseOrder(entity.getRelatedPurchaseOrder())
                .items(itemDtos)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private SaleOrder toEntity(SaleOrderDto dto) {
        SaleOrder entity = SaleOrder.builder()
                .code(dto.getCode())
                .quoteCode(dto.getQuoteCode())
                .poCode(dto.getPoCode())
                .orderDate(dto.getOrderDate() != null ? dto.getOrderDate() : LocalDateTime.now())
                .deliveryDate(dto.getDeliveryDate() != null ? dto.getDeliveryDate() : LocalDateTime.now().plusDays(3))
                .customerId(dto.getCustomerId())
                .customerName(dto.getCustomerName())
                .customerPhone(dto.getCustomerPhone())
                .salesperson(dto.getSalesperson())
                .paymentTerm(dto.getPaymentTerm())
                .outlet(dto.getOutlet())
                .templateName(dto.getTemplateName())
                .status(dto.getStatus() != null ? dto.getStatus() : "CONFIRMED")
                .creditLimit(dto.getCreditLimit() != null ? dto.getCreditLimit() : BigDecimal.ZERO)
                .availableCredit(dto.getAvailableCredit() != null ? dto.getAvailableCredit() : BigDecimal.ZERO)
                .subAmount(dto.getSubAmount() != null ? dto.getSubAmount() : BigDecimal.ZERO)
                .discountPercent(dto.getDiscountPercent() != null ? dto.getDiscountPercent() : BigDecimal.ZERO)
                .discountAmount(dto.getDiscountAmount() != null ? dto.getDiscountAmount() : BigDecimal.ZERO)
                .taxAmount(dto.getTaxAmount() != null ? dto.getTaxAmount() : BigDecimal.ZERO)
                .markupAmount(dto.getMarkupAmount() != null ? dto.getMarkupAmount() : BigDecimal.ZERO)
                .grandTotal(dto.getGrandTotal() != null ? dto.getGrandTotal() : BigDecimal.ZERO)
                .balance(dto.getBalance() != null ? dto.getBalance() : BigDecimal.ZERO)
                .reference(dto.getReference())
                .username(dto.getUsername() != null ? dto.getUsername() : "admin")
                .note(dto.getNote())
                .relatedPurchaseOrder(dto.getRelatedPurchaseOrder())
                .items(new ArrayList<>())
                .build();

        if (dto.getItems() != null) {
            for (SaleOrderItemDto it : dto.getItems()) {
                entity.getItems().add(SaleOrderItem.builder()
                        .saleOrder(entity)
                        .productId(it.getProductId())
                        .productCode(it.getProductCode())
                        .barcode(it.getBarcode())
                        .description(it.getDescription())
                        .qty(it.getQty() != null ? it.getQty() : BigDecimal.ONE)
                        .price(it.getPrice() != null ? it.getPrice() : BigDecimal.ZERO)
                        .discount(it.getDiscount() != null ? it.getDiscount() : BigDecimal.ZERO)
                        .uom(it.getUom() != null ? it.getUom() : "PCS")
                        .total(it.getTotal() != null ? it.getTotal() : BigDecimal.ZERO)
                        .build());
            }
        }
        return entity;
    }
}
`

const saleOrderController = `package com.bgroceries.backend.controller.Sale;

import com.bgroceries.backend.dto.SaleOrderDto;
import com.bgroceries.backend.dto.response.ApiResponse;
import com.bgroceries.backend.service.SaleOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/sale-orders")
@RequiredArgsConstructor
public class SaleOrderController {
    private final SaleOrderService saleOrderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SaleOrderDto>>> getAllSaleOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "any") String searchBy,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String outlet,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        List<SaleOrderDto> list = saleOrderService.getAllSaleOrders(search, searchBy, status, outlet, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Sale orders retrieved successfully", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SaleOrderDto>> getSaleOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Sale order retrieved successfully", saleOrderService.getSaleOrderById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SaleOrderDto>> createSaleOrder(@RequestBody SaleOrderDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Sale order created successfully", saleOrderService.createSaleOrder(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SaleOrderDto>> updateSaleOrder(@PathVariable Long id, @RequestBody SaleOrderDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Sale order updated successfully", saleOrderService.updateSaleOrder(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSaleOrder(@PathVariable Long id) {
        saleOrderService.deleteSaleOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Sale order deleted successfully"));
    }

    @GetMapping("/next-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> getNextCode() {
        return ResponseEntity.ok(ApiResponse.success("Next code generated", Map.of("code", saleOrderService.generateNextCode())));
    }
}
`

// --------------------------------------------------------------------------
// 2. WEB ORDER
// --------------------------------------------------------------------------
const webOrderEntity = `package com.bgroceries.backend.entity.Sale;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "web_order")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", length = 60, nullable = false, unique = true)
    private String code; // Order Code

    @Column(name = "order_date", nullable = false)
    private LocalDateTime orderDate;

    @Column(name = "delivery_date")
    private LocalDateTime deliveryDate;

    @Column(name = "salesperson", length = 100)
    private String salesperson;

    @Column(name = "customer_name", length = 200, nullable = false)
    private String customerName;

    @Column(name = "phone", length = 60)
    private String phone;

    @Column(name = "grand_total", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal grandTotal = BigDecimal.ZERO;

    @Column(name = "balance", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private String status = "PENDING"; // PENDING, PROCESSING, READY_TO_SHIP, DELIVERED, CANCELLED

    @Column(name = "reference", length = 100)
    private String reference;

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "markup", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal markup = BigDecimal.ZERO;

    @Column(name = "outlet", length = 100)
    private String outlet;

    @Column(name = "channel", length = 100)
    private String channel;

    @Column(name = "shipping_address", length = 300)
    private String shippingAddress;

    @OneToMany(mappedBy = "webOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<WebOrderItem> items = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.orderDate == null) this.orderDate = LocalDateTime.now();
        if (this.status == null) this.status = "PENDING";
        if (this.grandTotal == null) this.grandTotal = BigDecimal.ZERO;
        if (this.balance == null) this.balance = this.grandTotal;
    }
}
`

const webOrderItemEntity = `package com.bgroceries.backend.entity.Sale;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "web_order_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebOrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "web_order_id", nullable = false)
    @JsonBackReference
    private WebOrder webOrder;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "product_code", length = 60)
    private String productCode;

    @Column(name = "description", length = 255, nullable = false)
    private String description;

    @Column(name = "qty", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal qty = BigDecimal.ONE;

    @Column(name = "price", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "total", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal total = BigDecimal.ZERO;
}
`

const webOrderDto = `package com.bgroceries.backend.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebOrderDto {
    private Long id;
    private String code;
    private LocalDateTime orderDate;
    private LocalDateTime deliveryDate;
    private String salesperson;
    private String customerName;
    private String phone;
    private BigDecimal grandTotal;
    private BigDecimal balance;
    private String status;
    private String reference;
    private String username;
    private BigDecimal markup;
    private String outlet;
    private String channel;
    private String shippingAddress;
    @Builder.Default
    private List<WebOrderItemDto> items = new ArrayList<>();
    private LocalDateTime createdAt;
}
`

const webOrderItemDto = `package com.bgroceries.backend.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebOrderItemDto {
    private Long id;
    private Long productId;
    private String productCode;
    private String description;
    private BigDecimal qty;
    private BigDecimal price;
    private BigDecimal total;
}
`

const webOrderRepo = `package com.bgroceries.backend.repository;

import com.bgroceries.backend.entity.Sale.WebOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WebOrderRepository extends JpaRepository<WebOrder, Long> {
    Optional<WebOrder> findByCode(String code);

    @Query("SELECT w FROM WebOrder w WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(w.code) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(w.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(w.phone) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR :status = '' OR :status = 'ALL' OR w.status = :status) AND " +
           "(:outlet IS NULL OR :outlet = '' OR :outlet = 'ALL' OR w.outlet = :outlet) AND " +
           "(:startDate IS NULL OR w.orderDate >= :startDate) AND " +
           "(:endDate IS NULL OR w.orderDate <= :endDate) " +
           "ORDER BY w.createdAt DESC")
    List<WebOrder> searchWebOrders(
            @Param("search") String search,
            @Param("status") String status,
            @Param("outlet") String outlet,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    List<WebOrder> findTop50ByOrderByCreatedAtDesc();
}
`

const webOrderService = `package com.bgroceries.backend.service;

import com.bgroceries.backend.dto.WebOrderDto;
import java.time.LocalDateTime;
import java.util.List;

public interface WebOrderService {
    List<WebOrderDto> getAllWebOrders(String search, String searchBy, String status, String outlet, LocalDateTime startDate, LocalDateTime endDate);
    WebOrderDto getWebOrderById(Long id);
    WebOrderDto createWebOrder(WebOrderDto dto);
    WebOrderDto updateWebOrder(Long id, WebOrderDto dto);
    void deleteWebOrder(Long id);
    String generateNextCode();
}
`

const webOrderServiceImpl = `package com.bgroceries.backend.service.impl;

import com.bgroceries.backend.dto.WebOrderDto;
import com.bgroceries.backend.dto.WebOrderItemDto;
import com.bgroceries.backend.entity.Sale.WebOrder;
import com.bgroceries.backend.entity.Sale.WebOrderItem;
import com.bgroceries.backend.repository.WebOrderRepository;
import com.bgroceries.backend.service.WebOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WebOrderServiceImpl implements WebOrderService {
    private final WebOrderRepository webOrderRepository;

    @Override
    @Transactional(readOnly = true)
    public List<WebOrderDto> getAllWebOrders(String search, String searchBy, String status, String outlet, LocalDateTime startDate, LocalDateTime endDate) {
        List<WebOrder> list;
        if ((search != null && !search.isBlank()) || (status != null && !status.equalsIgnoreCase("ALL")) || (outlet != null && !outlet.equalsIgnoreCase("ALL")) || startDate != null || endDate != null) {
            list = webOrderRepository.searchWebOrders(search, status, outlet, startDate, endDate);
        } else {
            list = webOrderRepository.findTop50ByOrderByCreatedAtDesc();
        }
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WebOrderDto getWebOrderById(Long id) {
        return toDto(webOrderRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Web Order not found: " + id)));
    }

    @Override
    @Transactional
    public WebOrderDto createWebOrder(WebOrderDto dto) {
        if (dto.getCode() == null || dto.getCode().isBlank() || dto.getCode().equalsIgnoreCase("AUTO")) {
            dto.setCode(generateNextCode());
        }
        WebOrder entity = toEntity(dto);
        return toDto(webOrderRepository.save(entity));
    }

    @Override
    @Transactional
    public WebOrderDto updateWebOrder(Long id, WebOrderDto dto) {
        WebOrder existing = webOrderRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Web Order not found: " + id));
        existing.setDeliveryDate(dto.getDeliveryDate());
        existing.setCustomerName(dto.getCustomerName());
        existing.setPhone(dto.getPhone());
        existing.setSalesperson(dto.getSalesperson());
        existing.setOutlet(dto.getOutlet());
        existing.setStatus(dto.getStatus() != null ? dto.getStatus() : existing.getStatus());
        existing.setGrandTotal(dto.getGrandTotal() != null ? dto.getGrandTotal() : BigDecimal.ZERO);
        existing.setBalance(dto.getBalance() != null ? dto.getBalance() : BigDecimal.ZERO);
        existing.setMarkup(dto.getMarkup() != null ? dto.getMarkup() : BigDecimal.ZERO);
        existing.setReference(dto.getReference());
        existing.setUsername(dto.getUsername());
        existing.setShippingAddress(dto.getShippingAddress());
        return toDto(webOrderRepository.save(existing));
    }

    @Override
    @Transactional
    public void deleteWebOrder(Long id) {
        webOrderRepository.deleteById(id);
    }

    @Override
    public String generateNextCode() {
        return "WEB-" + DateTimeFormatter.ofPattern("yyyyMM").format(LocalDateTime.now()) + "-" + String.format("%04d", webOrderRepository.count() + 1);
    }

    private WebOrderDto toDto(WebOrder entity) {
        List<WebOrderItemDto> items = entity.getItems() != null
                ? entity.getItems().stream().map(i -> WebOrderItemDto.builder()
                .id(i.getId()).productId(i.getProductId()).productCode(i.getProductCode()).description(i.getDescription()).qty(i.getQty()).price(i.getPrice()).total(i.getTotal()).build()).collect(Collectors.toList())
                : new ArrayList<>();

        return WebOrderDto.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .orderDate(entity.getOrderDate())
                .deliveryDate(entity.getDeliveryDate())
                .salesperson(entity.getSalesperson())
                .customerName(entity.getCustomerName())
                .phone(entity.getPhone())
                .grandTotal(entity.getGrandTotal())
                .balance(entity.getBalance())
                .status(entity.getStatus())
                .reference(entity.getReference())
                .username(entity.getUsername())
                .markup(entity.getMarkup())
                .outlet(entity.getOutlet())
                .channel(entity.getChannel())
                .shippingAddress(entity.getShippingAddress())
                .items(items)
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private WebOrder toEntity(WebOrderDto dto) {
        WebOrder entity = WebOrder.builder()
                .code(dto.getCode())
                .orderDate(dto.getOrderDate() != null ? dto.getOrderDate() : LocalDateTime.now())
                .deliveryDate(dto.getDeliveryDate() != null ? dto.getDeliveryDate() : LocalDateTime.now().plusDays(2))
                .salesperson(dto.getSalesperson())
                .customerName(dto.getCustomerName())
                .phone(dto.getPhone())
                .grandTotal(dto.getGrandTotal() != null ? dto.getGrandTotal() : BigDecimal.ZERO)
                .balance(dto.getBalance() != null ? dto.getBalance() : BigDecimal.ZERO)
                .status(dto.getStatus() != null ? dto.getStatus() : "PENDING")
                .reference(dto.getReference())
                .username(dto.getUsername() != null ? dto.getUsername() : "online_buyer")
                .markup(dto.getMarkup() != null ? dto.getMarkup() : BigDecimal.ZERO)
                .outlet(dto.getOutlet() != null ? dto.getOutlet() : "Online Store")
                .channel(dto.getChannel() != null ? dto.getChannel() : "Web Storefront")
                .shippingAddress(dto.getShippingAddress())
                .items(new ArrayList<>())
                .build();

        if (dto.getItems() != null) {
            for (WebOrderItemDto it : dto.getItems()) {
                entity.getItems().add(WebOrderItem.builder()
                        .webOrder(entity)
                        .productId(it.getProductId())
                        .productCode(it.getProductCode())
                        .description(it.getDescription())
                        .qty(it.getQty() != null ? it.getQty() : BigDecimal.ONE)
                        .price(it.getPrice() != null ? it.getPrice() : BigDecimal.ZERO)
                        .total(it.getTotal() != null ? it.getTotal() : BigDecimal.ZERO)
                        .build());
            }
        }
        return entity;
    }
}
`

const webOrderController = `package com.bgroceries.backend.controller.Sale;

import com.bgroceries.backend.dto.WebOrderDto;
import com.bgroceries.backend.dto.response.ApiResponse;
import com.bgroceries.backend.service.WebOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/web-orders")
@RequiredArgsConstructor
public class WebOrderController {
    private final WebOrderService webOrderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WebOrderDto>>> getAllWebOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "any") String searchBy,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String outlet,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        List<WebOrderDto> list = webOrderService.getAllWebOrders(search, searchBy, status, outlet, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Web orders retrieved successfully", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WebOrderDto>> getWebOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Web order retrieved successfully", webOrderService.getWebOrderById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WebOrderDto>> createWebOrder(@RequestBody WebOrderDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Web order created successfully", webOrderService.createWebOrder(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WebOrderDto>> updateWebOrder(@PathVariable Long id, @RequestBody WebOrderDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Web order updated successfully", webOrderService.updateWebOrder(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWebOrder(@PathVariable Long id) {
        webOrderService.deleteWebOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Web order deleted successfully"));
    }

    @GetMapping("/next-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> getNextCode() {
        return ResponseEntity.ok(ApiResponse.success("Next code generated", Map.of("code", webOrderService.generateNextCode())));
    }
}
`

// --------------------------------------------------------------------------
// 3. SHIPMENT
// --------------------------------------------------------------------------
const shipmentEntity = `package com.bgroceries.backend.entity.Sale;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shipment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ship_code", length = 60, nullable = false, unique = true)
    private String shipCode;

    @Column(name = "date", nullable = false)
    private LocalDateTime date;

    @Column(name = "customer", length = 200, nullable = false)
    private String customer;

    @Column(name = "phone", length = 60)
    private String phone;

    @Column(name = "balance", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "delivery_person", length = 100)
    private String deliveryPerson;

    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private String status = "READY"; // READY, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED

    @Column(name = "salesperson", length = 100)
    private String salesperson;

    @Column(name = "reference", length = 100)
    private String reference;

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "outlet", length = 100)
    private String outlet;

    @Column(name = "carrier", length = 100)
    private String carrier;

    @Column(name = "destination", length = 300)
    private String destination;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.date == null) this.date = LocalDateTime.now();
        if (this.status == null) this.status = "READY";
        if (this.amount == null) this.amount = BigDecimal.ZERO;
        if (this.balance == null) this.balance = BigDecimal.ZERO;
    }
}
`

const shipmentDto = `package com.bgroceries.backend.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipmentDto {
    private Long id;
    private String shipCode;
    private LocalDateTime date;
    private String customer;
    private String phone;
    private BigDecimal balance;
    private BigDecimal amount;
    private String deliveryPerson;
    private String status;
    private String salesperson;
    private String reference;
    private String username;
    private String outlet;
    private String carrier;
    private String destination;
    private LocalDateTime createdAt;
}
`

const shipmentRepo = `package com.bgroceries.backend.repository;

import com.bgroceries.backend.entity.Sale.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    Optional<Shipment> findByShipCode(String shipCode);

    @Query("SELECT s FROM Shipment s WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(s.shipCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.customer) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.reference) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.deliveryPerson) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR :status = '' OR :status = 'ALL' OR s.status = :status) AND " +
           "(:outlet IS NULL OR :outlet = '' OR :outlet = 'ALL' OR s.outlet = :outlet) AND " +
           "(:startDate IS NULL OR s.date >= :startDate) AND " +
           "(:endDate IS NULL OR s.date <= :endDate) " +
           "ORDER BY s.createdAt DESC")
    List<Shipment> searchShipments(
            @Param("search") String search,
            @Param("status") String status,
            @Param("outlet") String outlet,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    List<Shipment> findTop50ByOrderByCreatedAtDesc();
}
`

const shipmentService = `package com.bgroceries.backend.service;

import com.bgroceries.backend.dto.ShipmentDto;
import java.time.LocalDateTime;
import java.util.List;

public interface ShipmentService {
    List<ShipmentDto> getAllShipments(String search, String searchBy, String status, String outlet, LocalDateTime startDate, LocalDateTime endDate);
    ShipmentDto getShipmentById(Long id);
    ShipmentDto createShipment(ShipmentDto dto);
    ShipmentDto updateShipment(Long id, ShipmentDto dto);
    void deleteShipment(Long id);
    String generateNextCode();
}
`

const shipmentServiceImpl = `package com.bgroceries.backend.service.impl;

import com.bgroceries.backend.dto.ShipmentDto;
import com.bgroceries.backend.entity.Sale.Shipment;
import com.bgroceries.backend.repository.ShipmentRepository;
import com.bgroceries.backend.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShipmentServiceImpl implements ShipmentService {
    private final ShipmentRepository shipmentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ShipmentDto> getAllShipments(String search, String searchBy, String status, String outlet, LocalDateTime startDate, LocalDateTime endDate) {
        List<Shipment> list;
        if ((search != null && !search.isBlank()) || (status != null && !status.equalsIgnoreCase("ALL")) || (outlet != null && !outlet.equalsIgnoreCase("ALL")) || startDate != null || endDate != null) {
            list = shipmentRepository.searchShipments(search, status, outlet, startDate, endDate);
        } else {
            list = shipmentRepository.findTop50ByOrderByCreatedAtDesc();
        }
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ShipmentDto getShipmentById(Long id) {
        return toDto(shipmentRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Shipment not found: " + id)));
    }

    @Override
    @Transactional
    public ShipmentDto createShipment(ShipmentDto dto) {
        if (dto.getShipCode() == null || dto.getShipCode().isBlank() || dto.getShipCode().equalsIgnoreCase("AUTO")) {
            dto.setShipCode(generateNextCode());
        }
        Shipment entity = toEntity(dto);
        return toDto(shipmentRepository.save(entity));
    }

    @Override
    @Transactional
    public ShipmentDto updateShipment(Long id, ShipmentDto dto) {
        Shipment existing = shipmentRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Shipment not found: " + id));
        existing.setCustomer(dto.getCustomer());
        existing.setPhone(dto.getPhone());
        existing.setAmount(dto.getAmount() != null ? dto.getAmount() : BigDecimal.ZERO);
        existing.setBalance(dto.getBalance() != null ? dto.getBalance() : BigDecimal.ZERO);
        existing.setDeliveryPerson(dto.getDeliveryPerson());
        existing.setStatus(dto.getStatus() != null ? dto.getStatus() : existing.getStatus());
        existing.setSalesperson(dto.getSalesperson());
        existing.setReference(dto.getReference());
        existing.setUsername(dto.getUsername());
        existing.setOutlet(dto.getOutlet());
        existing.setCarrier(dto.getCarrier());
        existing.setDestination(dto.getDestination());
        return toDto(shipmentRepository.save(existing));
    }

    @Override
    @Transactional
    public void deleteShipment(Long id) {
        shipmentRepository.deleteById(id);
    }

    @Override
    public String generateNextCode() {
        return "SHP-" + DateTimeFormatter.ofPattern("yyyyMM").format(LocalDateTime.now()) + "-" + String.format("%04d", shipmentRepository.count() + 1);
    }

    private ShipmentDto toDto(Shipment entity) {
        return ShipmentDto.builder()
                .id(entity.getId())
                .shipCode(entity.getShipCode())
                .date(entity.getDate())
                .customer(entity.getCustomer())
                .phone(entity.getPhone())
                .balance(entity.getBalance())
                .amount(entity.getAmount())
                .deliveryPerson(entity.getDeliveryPerson())
                .status(entity.getStatus())
                .salesperson(entity.getSalesperson())
                .reference(entity.getReference())
                .username(entity.getUsername())
                .outlet(entity.getOutlet())
                .carrier(entity.getCarrier())
                .destination(entity.getDestination())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private Shipment toEntity(ShipmentDto dto) {
        return Shipment.builder()
                .shipCode(dto.getShipCode())
                .date(dto.getDate() != null ? dto.getDate() : LocalDateTime.now())
                .customer(dto.getCustomer())
                .phone(dto.getPhone())
                .balance(dto.getBalance() != null ? dto.getBalance() : BigDecimal.ZERO)
                .amount(dto.getAmount() != null ? dto.getAmount() : BigDecimal.ZERO)
                .deliveryPerson(dto.getDeliveryPerson())
                .status(dto.getStatus() != null ? dto.getStatus() : "READY")
                .salesperson(dto.getSalesperson())
                .reference(dto.getReference())
                .username(dto.getUsername() != null ? dto.getUsername() : "dispatcher")
                .outlet(dto.getOutlet() != null ? dto.getOutlet() : "Main Store")
                .carrier(dto.getCarrier() != null ? dto.getCarrier() : "Internal Fleet Driver")
                .destination(dto.getDestination())
                .build();
    }
}
`

const shipmentController = `package com.bgroceries.backend.controller.Sale;

import com.bgroceries.backend.dto.ShipmentDto;
import com.bgroceries.backend.dto.response.ApiResponse;
import com.bgroceries.backend.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/shipments")
@RequiredArgsConstructor
public class ShipmentController {
    private final ShipmentService shipmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShipmentDto>>> getAllShipments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "any") String searchBy,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String outlet,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        List<ShipmentDto> list = shipmentService.getAllShipments(search, searchBy, status, outlet, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Shipments retrieved successfully", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShipmentDto>> getShipmentById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Shipment retrieved successfully", shipmentService.getShipmentById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ShipmentDto>> createShipment(@RequestBody ShipmentDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Shipment created successfully", shipmentService.createShipment(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ShipmentDto>> updateShipment(@PathVariable Long id, @RequestBody ShipmentDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Shipment updated successfully", shipmentService.updateShipment(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteShipment(@PathVariable Long id) {
        shipmentService.deleteShipment(id);
        return ResponseEntity.ok(ApiResponse.success("Shipment deleted successfully"));
    }

    @GetMapping("/next-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> getNextCode() {
        return ResponseEntity.ok(ApiResponse.success("Next code generated", Map.of("code", shipmentService.generateNextCode())));
    }
}
`

// --------------------------------------------------------------------------
// 4. RETURN SHIPMENT
// --------------------------------------------------------------------------
const returnShipmentEntity = `package com.bgroceries.backend.entity.Sale;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "return_shipment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnShipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "return_ship_code", length = 60, nullable = false, unique = true)
    private String returnShipCode;

    @Column(name = "so_code", length = 60)
    private String soCode;

    @Column(name = "date", nullable = false)
    private LocalDateTime date;

    @Column(name = "customer", length = 200, nullable = false)
    private String customer;

    @Column(name = "delivery_person", length = 100)
    private String deliveryPerson;

    @Column(name = "amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private String status = "RECEIVED"; // RECEIVED, RESTOCKED, REFUNDED, REJECTED

    @Column(name = "outlet", length = 100)
    private String outlet;

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.date == null) this.date = LocalDateTime.now();
        if (this.status == null) this.status = "RECEIVED";
        if (this.amount == null) this.amount = BigDecimal.ZERO;
    }
}
`

const returnShipmentDto = `package com.bgroceries.backend.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnShipmentDto {
    private Long id;
    private String returnShipCode;
    private String soCode;
    private LocalDateTime date;
    private String customer;
    private String deliveryPerson;
    private BigDecimal amount;
    private String status;
    private String outlet;
    private String username;
    private LocalDateTime createdAt;
}
`

const returnShipmentRepo = `package com.bgroceries.backend.repository;

import com.bgroceries.backend.entity.Sale.ReturnShipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReturnShipmentRepository extends JpaRepository<ReturnShipment, Long> {
    Optional<ReturnShipment> findByReturnShipCode(String returnShipCode);

    @Query("SELECT r FROM ReturnShipment r WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(r.returnShipCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(r.soCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(r.customer) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR :status = '' OR :status = 'ALL' OR r.status = :status) AND " +
           "(:outlet IS NULL OR :outlet = '' OR :outlet = 'ALL' OR r.outlet = :outlet) AND " +
           "(:startDate IS NULL OR r.date >= :startDate) AND " +
           "(:endDate IS NULL OR r.date <= :endDate) " +
           "ORDER BY r.createdAt DESC")
    List<ReturnShipment> searchReturnShipments(
            @Param("search") String search,
            @Param("status") String status,
            @Param("outlet") String outlet,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    List<ReturnShipment> findTop50ByOrderByCreatedAtDesc();
}
`

const returnShipmentService = `package com.bgroceries.backend.service;

import com.bgroceries.backend.dto.ReturnShipmentDto;
import java.time.LocalDateTime;
import java.util.List;

public interface ReturnShipmentService {
    List<ReturnShipmentDto> getAllReturnShipments(String search, String searchBy, String status, String outlet, LocalDateTime startDate, LocalDateTime endDate);
    ReturnShipmentDto getReturnShipmentById(Long id);
    ReturnShipmentDto createReturnShipment(ReturnShipmentDto dto);
    ReturnShipmentDto updateReturnShipment(Long id, ReturnShipmentDto dto);
    void deleteReturnShipment(Long id);
    String generateNextCode();
}
`

const returnShipmentServiceImpl = `package com.bgroceries.backend.service.impl;

import com.bgroceries.backend.dto.ReturnShipmentDto;
import com.bgroceries.backend.entity.Sale.ReturnShipment;
import com.bgroceries.backend.repository.ReturnShipmentRepository;
import com.bgroceries.backend.service.ReturnShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReturnShipmentServiceImpl implements ReturnShipmentService {
    private final ReturnShipmentRepository returnShipmentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ReturnShipmentDto> getAllReturnShipments(String search, String searchBy, String status, String outlet, LocalDateTime startDate, LocalDateTime endDate) {
        List<ReturnShipment> list;
        if ((search != null && !search.isBlank()) || (status != null && !status.equalsIgnoreCase("ALL")) || (outlet != null && !outlet.equalsIgnoreCase("ALL")) || startDate != null || endDate != null) {
            list = returnShipmentRepository.searchReturnShipments(search, status, outlet, startDate, endDate);
        } else {
            list = returnShipmentRepository.findTop50ByOrderByCreatedAtDesc();
        }
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnShipmentDto getReturnShipmentById(Long id) {
        return toDto(returnShipmentRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Return Shipment not found: " + id)));
    }

    @Override
    @Transactional
    public ReturnShipmentDto createReturnShipment(ReturnShipmentDto dto) {
        if (dto.getReturnShipCode() == null || dto.getReturnShipCode().isBlank() || dto.getReturnShipCode().equalsIgnoreCase("AUTO")) {
            dto.setReturnShipCode(generateNextCode());
        }
        ReturnShipment entity = toEntity(dto);
        return toDto(returnShipmentRepository.save(entity));
    }

    @Override
    @Transactional
    public ReturnShipmentDto updateReturnShipment(Long id, ReturnShipmentDto dto) {
        ReturnShipment existing = returnShipmentRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Return Shipment not found: " + id));
        existing.setSoCode(dto.getSoCode());
        existing.setCustomer(dto.getCustomer());
        existing.setDeliveryPerson(dto.getDeliveryPerson());
        existing.setAmount(dto.getAmount() != null ? dto.getAmount() : BigDecimal.ZERO);
        existing.setStatus(dto.getStatus() != null ? dto.getStatus() : existing.getStatus());
        existing.setOutlet(dto.getOutlet());
        existing.setUsername(dto.getUsername());
        return toDto(returnShipmentRepository.save(existing));
    }

    @Override
    @Transactional
    public void deleteReturnShipment(Long id) {
        returnShipmentRepository.deleteById(id);
    }

    @Override
    public String generateNextCode() {
        return "RET-" + DateTimeFormatter.ofPattern("yyyyMM").format(LocalDateTime.now()) + "-" + String.format("%04d", returnShipmentRepository.count() + 1);
    }

    private ReturnShipmentDto toDto(ReturnShipment entity) {
        return ReturnShipmentDto.builder()
                .id(entity.getId())
                .returnShipCode(entity.getReturnShipCode())
                .soCode(entity.getSoCode())
                .date(entity.getDate())
                .customer(entity.getCustomer())
                .deliveryPerson(entity.getDeliveryPerson())
                .amount(entity.getAmount())
                .status(entity.getStatus())
                .outlet(entity.getOutlet())
                .username(entity.getUsername())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private ReturnShipment toEntity(ReturnShipmentDto dto) {
        return ReturnShipment.builder()
                .returnShipCode(dto.getReturnShipCode())
                .soCode(dto.getSoCode())
                .date(dto.getDate() != null ? dto.getDate() : LocalDateTime.now())
                .customer(dto.getCustomer())
                .deliveryPerson(dto.getDeliveryPerson())
                .amount(dto.getAmount() != null ? dto.getAmount() : BigDecimal.ZERO)
                .status(dto.getStatus() != null ? dto.getStatus() : "RECEIVED")
                .outlet(dto.getOutlet() != null ? dto.getOutlet() : "Main Store")
                .username(dto.getUsername() != null ? dto.getUsername() : "inspector")
                .build();
    }
}
`

const returnShipmentController = `package com.bgroceries.backend.controller.Sale;

import com.bgroceries.backend.dto.ReturnShipmentDto;
import com.bgroceries.backend.dto.response.ApiResponse;
import com.bgroceries.backend.service.ReturnShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/return-shipments")
@RequiredArgsConstructor
public class ReturnShipmentController {
    private final ReturnShipmentService returnShipmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReturnShipmentDto>>> getAllReturnShipments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "any") String searchBy,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String outlet,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        List<ReturnShipmentDto> list = returnShipmentService.getAllReturnShipments(search, searchBy, status, outlet, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Return shipments retrieved successfully", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReturnShipmentDto>> getReturnShipmentById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Return shipment retrieved successfully", returnShipmentService.getReturnShipmentById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReturnShipmentDto>> createReturnShipment(@RequestBody ReturnShipmentDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Return shipment created successfully", returnShipmentService.createReturnShipment(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReturnShipmentDto>> updateReturnShipment(@PathVariable Long id, @RequestBody ReturnShipmentDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Return shipment updated successfully", returnShipmentService.updateReturnShipment(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReturnShipment(@PathVariable Long id) {
        returnShipmentService.deleteReturnShipment(id);
        return ResponseEntity.ok(ApiResponse.success("Return shipment deleted successfully"));
    }

    @GetMapping("/next-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> getNextCode() {
        return ResponseEntity.ok(ApiResponse.success("Next code generated", Map.of("code", returnShipmentService.generateNextCode())));
    }
}
`

// All files to create
const files = [
  // 1. Sale Order
  { p: path.join(backendRoot, 'entity/Sale/SaleOrder.java'), c: saleOrderEntity },
  { p: path.join(backendRoot, 'entity/Sale/SaleOrderItem.java'), c: saleOrderItemEntity },
  { p: path.join(backendRoot, 'dto/SaleOrderDto.java'), c: saleOrderDto },
  { p: path.join(backendRoot, 'dto/SaleOrderItemDto.java'), c: saleOrderItemDto },
  { p: path.join(backendRoot, 'repository/SaleOrderRepository.java'), c: saleOrderRepo },
  { p: path.join(backendRoot, 'service/SaleOrderService.java'), c: saleOrderService },
  { p: path.join(backendRoot, 'service/impl/SaleOrderServiceImpl.java'), c: saleOrderServiceImpl },
  { p: path.join(backendRoot, 'controller/Sale/SaleOrderController.java'), c: saleOrderController },

  // 2. Web Order
  { p: path.join(backendRoot, 'entity/Sale/WebOrder.java'), c: webOrderEntity },
  { p: path.join(backendRoot, 'entity/Sale/WebOrderItem.java'), c: webOrderItemEntity },
  { p: path.join(backendRoot, 'dto/WebOrderDto.java'), c: webOrderDto },
  { p: path.join(backendRoot, 'dto/WebOrderItemDto.java'), c: webOrderItemDto },
  { p: path.join(backendRoot, 'repository/WebOrderRepository.java'), c: webOrderRepo },
  { p: path.join(backendRoot, 'service/WebOrderService.java'), c: webOrderService },
  { p: path.join(backendRoot, 'service/impl/WebOrderServiceImpl.java'), c: webOrderServiceImpl },
  { p: path.join(backendRoot, 'controller/Sale/WebOrderController.java'), c: webOrderController },

  // 3. Shipment
  { p: path.join(backendRoot, 'entity/Sale/Shipment.java'), c: shipmentEntity },
  { p: path.join(backendRoot, 'dto/ShipmentDto.java'), c: shipmentDto },
  { p: path.join(backendRoot, 'repository/ShipmentRepository.java'), c: shipmentRepo },
  { p: path.join(backendRoot, 'service/ShipmentService.java'), c: shipmentService },
  { p: path.join(backendRoot, 'service/impl/ShipmentServiceImpl.java'), c: shipmentServiceImpl },
  { p: path.join(backendRoot, 'controller/Sale/ShipmentController.java'), c: shipmentController },

  // 4. Return Shipment
  { p: path.join(backendRoot, 'entity/Sale/ReturnShipment.java'), c: returnShipmentEntity },
  { p: path.join(backendRoot, 'dto/ReturnShipmentDto.java'), c: returnShipmentDto },
  { p: path.join(backendRoot, 'repository/ReturnShipmentRepository.java'), c: returnShipmentRepo },
  { p: path.join(backendRoot, 'service/ReturnShipmentService.java'), c: returnShipmentService },
  { p: path.join(backendRoot, 'service/impl/ReturnShipmentServiceImpl.java'), c: returnShipmentServiceImpl },
  { p: path.join(backendRoot, 'controller/Sale/ReturnShipmentController.java'), c: returnShipmentController },
]

for (const f of files) {
  fs.mkdirSync(path.dirname(f.p), { recursive: true })
  fs.writeFileSync(f.p, f.c, 'utf8')
  console.log('Created backend file:', f.p)
}
console.log('Successfully generated all backend entities, DTOs, repositories, services, and controllers for all 4 modules!')
